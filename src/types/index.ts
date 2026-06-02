export type ComplaintCategory =
  | "defective-product"
  | "deficient-service"
  | "unfair-trade-practice"
  | "overcharging"
  | "ecommerce"
  | "real-estate";

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  district: string;
  pincode: string;
}

export interface ReliefSought {
  refund: boolean;
  replacement: boolean;
  repair: boolean;
  compensation: boolean;
  compensationAmount?: number;
  otherRelief?: string;
}

export type EscalationLevel =
  | "intake"
  | "grievance-email"
  | "follow-up-email"
  | "legal-notice"
  | "consumer-complaint"
  | "resolved";

export interface CompanyInfo {
  name: string;
  type: "company" | "individual" | "government";
  grievanceEmail?: string;
  escalationEmail?: string;
  registeredAddress?: Address;
  website?: string;
  lookupConfidence: "high" | "medium" | "low" | "user-provided";
}

export interface CorrespondenceEntry {
  id: string;
  level: EscalationLevel;
  dateSent: string;
  deadlineDate: string;
  recipientEmail: string;
  subject: string;
  body: string;
  status: "sent" | "response-received" | "no-response" | "unsatisfactory";
}

export interface EmailRefinementEntry {
  feedback: string;
  changeDescription: string;
  timestamp: string;
}

export interface CaseState {
  id: string;
  createdAt: string;
  updatedAt: string;
  currentLevel: EscalationLevel;
  userNarrative: string;
  extractedData: {
    category?: ComplaintCategory;
    subCategory?: string;
    companyName?: string;
    purchaseDate?: string;
    amountPaid?: number;
    reliefSought?: ReliefSought;
    complainantName?: string;
    complainantPhone?: string;
    complainantEmail?: string;
    priorAttempts?: string;
  };
  company: CompanyInfo | null;
  correspondence: CorrespondenceEntry[];
  emailRefinementHistory: EmailRefinementEntry[];
}
