import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const REFINE_EMAIL_PROMPT = `You are a consumer grievance email editor. You will receive a previously drafted email, the GROUND TRUTH facts about the case, and the user's request for changes.

═══ CRITICAL RULES ═══
- The GROUND TRUTH section contains the verified facts. NEVER contradict these.
- If the user is correcting a fact, update it EVERYWHERE in the email.
- Do NOT regenerate the email from scratch — modify only what's needed
- Preserve the overall structure, tone, and formatting
- Return the COMPLETE updated email (not just the changes)
- NEVER use relative dates — use actual dates only

═══ FORMATTING ═══
CRITICAL: Preserve the formatting of the original email. The "body" field MUST use \\n for line breaks.

RESPONSE FORMAT (JSON):
{
  "subject": "Updated subject line (or same if unchanged)",
  "body": "The complete updated email body with \\n for line breaks",
  "changeDescription": "Brief 3-8 word description of what changed"
}

Respond ONLY with valid JSON.`;

function getClient() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 503 });
  }

  try {
    const { currentEmail, userFeedback, caseContext } = await req.json();

    let groundTruth = "";
    if (caseContext) {
      const parts: string[] = [];
      if (caseContext.narrative) parts.push(`CONSUMER'S ORIGINAL DESCRIPTION: ${caseContext.narrative}`);
      if (caseContext.companyName) parts.push(`COMPANY: ${caseContext.companyName}`);
      if (caseContext.purchaseDate) parts.push(`PURCHASE DATE: ${caseContext.purchaseDate}`);
      if (caseContext.amountPaid) parts.push(`AMOUNT PAID: Rs. ${Number(caseContext.amountPaid).toLocaleString("en-IN")}`);
      if (parts.length > 0) {
        groundTruth = `\n\n═══ GROUND TRUTH (verified facts — do not contradict) ═══\n${parts.join("\n")}\n`;
      }
    }

    const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

    const userPrompt = `TODAY'S DATE: ${today}
${groundTruth}
CURRENT EMAIL:
Subject: ${currentEmail.subject}

${currentEmail.body}

---

USER'S REQUESTED CHANGE:
${userFeedback}

Update the email incorporating the user's request. Be precise — change exactly what they asked for, nothing else. Return the complete updated email.`;

    const completion = await getClient().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: REFINE_EMAIL_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    const text = completion.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(text);

    if (parsed.body) {
      parsed.body = parsed.body
        .replace(/\\n/g, "\n")
        .replace(/\r\n/g, "\n")
        .replace(/\n{4,}/g, "\n\n\n")
        .trim();
    }

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error("Email refinement error:", error);
    return NextResponse.json({ error: "Refinement failed" }, { status: 500 });
  }
}
