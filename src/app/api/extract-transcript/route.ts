import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const EXTRACT_SYSTEM_PROMPT = `You are a consumer dispute analyst. You will receive a transcript of a voice conversation between a consumer and an AI assistant.

Extract structured case details from the transcript.

RESPONSE FORMAT (JSON — always):
{
  "narrative": "A clear 2-4 sentence summary of the consumer's problem in their own words",
  "extractedData": {
    "category": "defective-product|deficient-service|unfair-trade-practice|overcharging|ecommerce|real-estate" or null,
    "subCategory": "string" or null,
    "companyName": "string" or null,
    "purchaseDate": "YYYY-MM-DD" or null,
    "amountPaid": number or null,
    "reliefSought": { "refund": bool, "replacement": bool, "repair": bool, "compensation": bool, "compensationAmount": number or null } or null,
    "complainantName": "string" or null,
    "complainantPhone": "string" or null,
    "complainantEmail": "string" or null,
    "priorAttempts": "string describing what user already tried" or null
  }
}

RULES:
- Extract ONLY what is explicitly stated. NEVER fabricate facts.
- If a field wasn't mentioned, set it to null.
- For amountPaid, convert to a number (e.g., "ten thousand" → 10000, "1 lakh" → 100000).
- For dates, convert to YYYY-MM-DD format. If only a month is mentioned, use the 1st of that month.
- For reliefSought, default to { "refund": true } if the user wants their money back but didn't specify other options.
- The narrative should be written as if the consumer is describing the problem (first person).

Respond ONLY with valid JSON.`;

function getClient() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 503 });
  }

  try {
    const { transcript } = await req.json();

    if (!transcript || typeof transcript !== "string" || transcript.trim().length < 10) {
      return NextResponse.json({ error: "Transcript too short" }, { status: 400 });
    }

    const completion = await getClient().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: EXTRACT_SYSTEM_PROMPT },
        { role: "user", content: `VOICE CONVERSATION TRANSCRIPT:\n\n${transcript}` },
      ],
      temperature: 0.2,
      max_tokens: 800,
      response_format: { type: "json_object" },
    });

    const text = completion.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(text);

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error("Extract transcript error:", error);
    return NextResponse.json({ error: "Extraction failed" }, { status: 500 });
  }
}
