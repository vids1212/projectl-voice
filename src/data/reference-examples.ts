export interface ReferenceExample {
  category: string;
  type: "grievance-email" | "legal-notice" | "complaint-narrative";
  summary: string;
  excerpt: string;
  outcome?: string;
  source: string;
}

export const REFERENCE_EXAMPLES: ReferenceExample[] = [
  {
    category: "ecommerce",
    type: "grievance-email",
    summary: "Defective product delivered, company refused return",
    excerpt: `Subject: Formal Grievance — Defective Product, Order #FL-2024-XXXXX

Dear Sir/Madam,

I am writing to formally register my grievance regarding a defective [product] purchased on your platform on [date] for Rs. [amount]. Despite raising a complaint on [date] (Ticket #XXXXX), your customer care team has failed to provide a satisfactory resolution within the stipulated timeframe.

Under Section 2(6) of the Consumer Protection Act, 2019, delivery of a defective product constitutes a "defect" entitling the consumer to replacement or full refund.

I hereby demand a full refund of Rs. [amount] within 15 days of receipt of this email, failing which I shall be constrained to approach the appropriate Consumer Disputes Redressal Commission for redressal.`,
    outcome: "Resolved at grievance stage — full refund processed within 7 days",
    source: "Curated from Voxya success stories",
  },
  {
    category: "ecommerce",
    type: "grievance-email",
    summary: "Non-delivery of order, refund denied",
    excerpt: `Subject: Grievance — Non-Delivery of Order #AM-2024-XXXXX & Refund Denial

Dear Sir/Madam,

This is to formally bring to your notice that I placed an order (#AM-2024-XXXXX) on [date] for [product] worth Rs. [amount]. The expected delivery date was [date], however, as of today the product has not been delivered.

Despite multiple follow-ups with your customer care (Ticket #XXXXX, dated [date]), I have been informed that the refund cannot be processed as the order shows "delivered" in your system. I categorically state that no delivery was made to my address.

Under Section 2(47) of the Consumer Protection Act, 2019, non-delivery of goods after accepting payment constitutes an unfair trade practice. I demand an immediate full refund of Rs. [amount] within 15 days.`,
    outcome: "Refund processed after grievance email + delivery investigation",
    source: "Curated from consumer forum cases",
  },
  {
    category: "defective-product",
    type: "grievance-email",
    summary: "Defective appliance under warranty, repair refused",
    excerpt: `Subject: Formal Grievance — Manufacturing Defect in [Product], Invoice No. [number]

Dear Sir/Madam,

I purchased a [product] from your authorized dealer [dealer name] on [date] for Rs. [amount] (Invoice No. [number]). The product is currently under warranty (valid until [date]).

Within [duration] of purchase, the product developed [specific defect]. Your authorized service center technician visited on [date] and confirmed this as a manufacturing defect (Service Report No. [number]). Despite this, your company is refusing to replace the product.

Under Section 2(10) of the Consumer Protection Act, 2019, this constitutes a "defect" in goods. I am entitled to replacement or full refund under Section 39(1)(a) and (b). I demand replacement with a new unit within 15 days.`,
    outcome: "Product replaced after grievance email with technician report attached",
    source: "Curated from NCDRC case patterns",
  },
];

export function getRelevantExamples(
  category: string,
  documentType: "grievance-email" | "legal-notice" | "complaint-narrative"
): ReferenceExample[] {
  const exact = REFERENCE_EXAMPLES.filter(
    (ex) => ex.category === category && ex.type === documentType
  );
  if (exact.length > 0) return exact.slice(0, 3);
  return REFERENCE_EXAMPLES.filter((ex) => ex.type === documentType).slice(0, 2);
}

export function buildExamplesBlock(examples: ReferenceExample[]): string {
  if (examples.length === 0) return "";
  return `
REFERENCE EXAMPLES — Study the tone, structure, and legal framing of these
successful ${examples[0].type}s in the same category. DO NOT copy them verbatim.
Adapt the style to the user's specific facts.

${examples
  .map(
    (ex, i) => `--- Example ${i + 1}: ${ex.summary} ---
${ex.excerpt}
${ex.outcome ? `Outcome: ${ex.outcome}` : ""}`
  )
  .join("\n\n")}
`;
}
