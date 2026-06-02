import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import type { CaseState, EscalationLevel } from "@/types";
import { getRelevantExamples, buildExamplesBlock } from "@/data/reference-examples";

const EMAIL_SYSTEM_PROMPT = `You are a professional email drafting assistant for Indian consumer disputes. Your goal is to help the consumer reach an amicable resolution while being clear about their rights.

═══ TONE (GRIEVANCE EMAIL — first contact) ═══
- Polite, respectful, and collaborative — NOT threatening
- Frame it as: "I'm reaching out hoping we can resolve this together"
- State the problem clearly with facts and dates
- Express disappointment but NOT hostility
- Request a specific resolution (refund/replacement/repair) with a reasonable 15-day timeline
- Do NOT mention Consumer Forum, legal action, or CPA 2019 in the first email
- End with: "I trust [Company] values its customers and will resolve this promptly"
- Use "Yours sincerely" (not "Yours faithfully")

═══ GENERAL RULES ═══
- Reference specific dates, amounts, and transaction details
- Never fabricate facts — use only what's provided
- If the consumer has already contacted the company, mention these prior attempts
- Keep language simple and clear

═══ QUALITY STANDARDS (critical) ═══
- NEVER use relative dates like "yesterday", "last week" — always use actual dates
- NEVER use template-like phrasing: "I wish to bring to your notice", "I would like to inform you"
- Write like a real person, not a form letter
- Lead with WHAT HAPPENED, not "I am writing to inform you"
- Include order/reference numbers inline, not as a separate list
- Subject line should be specific: "Wrong product delivered — Order #XYZ123" NOT "Regarding my recent order"
- Amounts should include Rs. symbol with commas (Rs. 1,00,000)

USING REFERENCE EXAMPLES:
When REFERENCE EXAMPLES are provided, study their tone, structure, and framing. Adapt the style to the user's facts. Do NOT copy them verbatim.

═══ FORMATTING ═══
The "body" field MUST contain proper formatting using newline characters (\\n):
- Separate paragraphs with a blank line (\\n\\n)
- Include proper salutation and sign-off on separate lines

RESPONSE FORMAT (JSON):
{
  "subject": "Email subject line",
  "body": "Full email body text with \\n for line breaks",
  "recipientEmail": "the company email",
  "recipientName": "company name"
}

Respond ONLY with valid JSON.`;

function getClient() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "API key not configured", useFallback: true }, { status: 503 });
  }

  try {
    const { caseState, escalationLevel } = (await req.json()) as {
      caseState: CaseState;
      escalationLevel: EscalationLevel;
    };

    const priorCorrespondence = caseState.correspondence
      .map(
        (c) =>
          `- ${c.level}: Sent ${c.dateSent}, to ${c.recipientEmail}, subject "${c.subject}", status: ${c.status}`
      )
      .join("\n");

    const docType = "grievance-email" as const;
    const category = caseState.extractedData.category || "ecommerce";
    const examples = getRelevantExamples(category, docType);
    const examplesBlock = buildExamplesBlock(examples);

    const priorAttempts = (caseState.extractedData as Record<string, unknown>).priorAttempts as string | undefined;

    const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

    const userPrompt = `Draft a grievance email with these details:

TODAY'S DATE: ${today}
COMPANY: ${caseState.company?.name ?? "Unknown"}
COMPANY EMAIL: ${caseState.company?.grievanceEmail ?? "N/A"}
CONSUMER'S PROBLEM: ${caseState.userNarrative}
AMOUNT PAID: Rs. ${caseState.extractedData.amountPaid?.toLocaleString("en-IN") ?? "N/A"}
PURCHASE DATE: ${caseState.extractedData.purchaseDate ?? "N/A"}
CATEGORY: ${caseState.extractedData.category ?? "N/A"}
RELIEF SOUGHT: ${JSON.stringify(caseState.extractedData.reliefSought ?? {})}
CONSUMER NAME: ${caseState.extractedData.complainantName ?? "N/A"}
CONSUMER PHONE: ${caseState.extractedData.complainantPhone ?? "N/A"}
CONSUMER EMAIL: ${caseState.extractedData.complainantEmail ?? "N/A"}
${priorAttempts ? `\nPRIOR ATTEMPTS BY CONSUMER (before this email):\n${priorAttempts}\n` : ""}
PRIOR CORRESPONDENCE (sent via this app):
${priorCorrespondence || "None"}

INSTRUCTION: Draft a polite but clear grievance email requesting resolution within 15 days. This is the FIRST formal contact — keep the tone collaborative and respectful. Do NOT threaten legal action.
${examplesBlock}`;

    const completion = await getClient().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: EMAIL_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    const text = completion.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(text);

    if (parsed.body) parsed.body = normaliseNewlines(parsed.body);

    // Quality check
    const qualityIssues = checkEmailQuality(parsed.body || "", caseState);
    if (qualityIssues.length > 0) {
      try {
        const refineCompletion = await getClient().chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You fix quality issues in drafted emails. Return ONLY valid JSON with keys: subject, body, recipientEmail, recipientName." },
            { role: "user", content: `Fix these issues:\n${qualityIssues.map(q => `- ${q}`).join("\n")}\n\nTODAY'S DATE: ${today}\nPURCHASE DATE: ${caseState.extractedData.purchaseDate ?? "N/A"}\n\nORIGINAL EMAIL:\n${JSON.stringify(parsed)}\n\nReturn corrected JSON.` },
          ],
          temperature: 0.2,
          max_tokens: 1500,
          response_format: { type: "json_object" },
        });
        const refined = JSON.parse(refineCompletion.choices[0]?.message?.content ?? "");
        if (refined.body && refined.body.length > parsed.body.length * 0.5) {
          parsed.subject = refined.subject || parsed.subject;
          parsed.body = refined.body;
        }
      } catch {
        // Refinement failed — continue with original
      }
    }

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error("Draft email error:", error);
    return NextResponse.json({ error: "Email generation failed" }, { status: 500 });
  }
}

function checkEmailQuality(body: string, caseState: CaseState): string[] {
  const issues: string[] = [];

  if (/\b(yesterday|last week|last month|recently|few days ago|today|the other day)\b/i.test(body)) {
    issues.push("Contains relative dates instead of actual dates.");
  }

  if (/\b(I am writing to (bring|inform|notify)|I wish to (bring|inform)|I would like to (inform|bring))/i.test(body)) {
    issues.push("Uses robotic/template phrasing. Rewrite naturally.");
  }

  return issues;
}

function normaliseNewlines(text: string): string {
  return text
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}
