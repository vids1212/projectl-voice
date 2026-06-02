export interface CompanyEntry {
  name: string;
  aliases: string[];
  grievanceEmail: string;
  escalationEmail?: string;
  website: string;
  category: string;
}

export const COMPANIES_DB: CompanyEntry[] = [
  // E-Commerce
  { name: "Amazon India", aliases: ["amazon", "amazon.in"], grievanceEmail: "grievance-officer@amazon.in", website: "amazon.in", category: "ecommerce" },
  { name: "Flipkart", aliases: ["flipkart"], grievanceEmail: "grievanceofficer@flipkart.com", website: "flipkart.com", category: "ecommerce" },
  { name: "Myntra", aliases: ["myntra"], grievanceEmail: "grievanceofficer@myntra.com", website: "myntra.com", category: "ecommerce" },
  { name: "Meesho", aliases: ["meesho"], grievanceEmail: "grievance@meesho.com", website: "meesho.com", category: "ecommerce" },
  { name: "Snapdeal", aliases: ["snapdeal"], grievanceEmail: "grievanceofficer@snapdeal.com", website: "snapdeal.com", category: "ecommerce" },
  { name: "Nykaa", aliases: ["nykaa"], grievanceEmail: "grievanceofficer@nykaa.com", website: "nykaa.com", category: "ecommerce" },
  { name: "Ajio", aliases: ["ajio"], grievanceEmail: "care@ajio.com", website: "ajio.com", category: "ecommerce" },

  // Electronics
  { name: "Samsung India", aliases: ["samsung"], grievanceEmail: "grievanceofficer@samsung.com", escalationEmail: "nodalofficerindia@samsung.com", website: "samsung.com/in", category: "electronics" },
  { name: "Apple India", aliases: ["apple", "iphone", "macbook"], grievanceEmail: "grievanceofficer@apple.com", website: "apple.com/in", category: "electronics" },
  { name: "OnePlus", aliases: ["oneplus", "one plus"], grievanceEmail: "grievanceofficer@oneplus.com", website: "oneplus.in", category: "electronics" },
  { name: "Xiaomi India", aliases: ["xiaomi", "mi", "redmi", "poco"], grievanceEmail: "grievance.officer@xiaomi.com", website: "mi.com", category: "electronics" },

  // Telecom
  { name: "Jio (Reliance)", aliases: ["jio", "reliance jio", "jiofiber"], grievanceEmail: "appellate.authority@ril.com", website: "jio.com", category: "telecom" },
  { name: "Airtel", aliases: ["airtel", "bharti airtel"], grievanceEmail: "appellate.authority@airtel.com", escalationEmail: "nodalofficer@airtel.com", website: "airtel.in", category: "telecom" },
  { name: "Vi (Vodafone Idea)", aliases: ["vi", "vodafone", "idea"], grievanceEmail: "appellateauthority@vodafoneidea.com", website: "myvi.in", category: "telecom" },

  // Banking
  { name: "HDFC Bank", aliases: ["hdfc", "hdfc bank"], grievanceEmail: "headservicequality@hdfcbank.com", website: "hdfcbank.com", category: "banking" },
  { name: "ICICI Bank", aliases: ["icici", "icici bank"], grievanceEmail: "headservicequality@icicibank.com", website: "icicibank.com", category: "banking" },
  { name: "State Bank of India", aliases: ["sbi", "state bank"], grievanceEmail: "cgm.dnbs@sbi.co.in", website: "sbi.co.in", category: "banking" },

  // Insurance
  { name: "LIC of India", aliases: ["lic", "life insurance corporation"], grievanceEmail: "co_grievance@licindia.com", website: "licindia.in", category: "insurance" },
  { name: "Star Health Insurance", aliases: ["star health"], grievanceEmail: "gro@starhealth.in", website: "starhealth.in", category: "insurance" },

  // Travel
  { name: "IndiGo Airlines", aliases: ["indigo", "6e"], grievanceEmail: "grievanceofficer@goindigo.in", website: "goindigo.in", category: "travel" },
  { name: "MakeMyTrip", aliases: ["makemytrip", "mmt"], grievanceEmail: "grievanceofficer@makemytrip.com", website: "makemytrip.com", category: "travel" },

  // Food Delivery
  { name: "Zomato", aliases: ["zomato"], grievanceEmail: "grievanceofficer@zomato.com", website: "zomato.com", category: "ecommerce" },
  { name: "Swiggy", aliases: ["swiggy"], grievanceEmail: "grievanceofficer@swiggy.in", website: "swiggy.com", category: "ecommerce" },

  // Transport
  { name: "Ola", aliases: ["ola", "ola cabs"], grievanceEmail: "grievanceofficer@olacabs.com", website: "olacabs.com", category: "transport" },
  { name: "Uber India", aliases: ["uber"], grievanceEmail: "grievance-officer-india@uber.com", website: "uber.com", category: "transport" },

  // Payments
  { name: "Paytm", aliases: ["paytm"], grievanceEmail: "grievanceofficer@paytm.com", website: "paytm.com", category: "fintech" },
  { name: "PhonePe", aliases: ["phonepe"], grievanceEmail: "grievance@phonepe.com", website: "phonepe.com", category: "fintech" },

  // Education
  { name: "BYJU'S", aliases: ["byjus", "byju"], grievanceEmail: "grievanceofficer@byjus.com", website: "byjus.com", category: "education" },
];

export function searchCompany(query: string): CompanyEntry | null {
  const q = query.toLowerCase().trim();
  return (
    COMPANIES_DB.find(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.aliases.some((a) => q.includes(a) || a.includes(q))
    ) ?? null
  );
}
