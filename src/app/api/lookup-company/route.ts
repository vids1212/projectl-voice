import { NextRequest, NextResponse } from "next/server";
import { searchCompany } from "@/data/companies";

export async function POST(req: NextRequest) {
  try {
    const { companyName } = await req.json();

    if (!companyName || typeof companyName !== "string") {
      return NextResponse.json({ error: "companyName is required" }, { status: 400 });
    }

    const result = searchCompany(companyName);

    if (result) {
      return NextResponse.json({
        found: true,
        companyName: result.name,
        grievanceEmail: result.grievanceEmail,
        escalationEmail: result.escalationEmail ?? null,
        website: result.website,
        confidence: "high",
      });
    }

    return NextResponse.json({
      found: false,
      companyName,
      grievanceEmail: null,
      confidence: "low",
    });
  } catch (error: unknown) {
    console.error("Company lookup error:", error);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
