export type TransactionType = "income" | "expense";

export type Transaction = {
  id: string;
  title: string;
  amount: number;
  category: string;
  type: TransactionType;
  date: string;
  note?: string;
};

export type Company = {
  id: string;
  name: string;
  currency: string;
  logo?: string;
  joinCode: string;
  memberCount?: number;
};

export const CATEGORIES = {
  income: [
    "Product Sales",
    "Service Revenue",
    "Project Revenue",
    "Consulting",
    "Subscription",
    "Commission",
    "Royalty",
    "Investment Return",
    "Grant & Funding",
    "Partnership Revenue",
    "Other Income",
  ],
  expense: [
    "Operations",
    "Payroll & Benefits",
    "Marketing & Ads",
    "Software & Tools",
    "Infrastructure",
    "Office & Facilities",
    "Business Travel",
    "Legal & Compliance",
    "Research & Dev",
    "Training",
    "Tax & Duties",
    "Vendor & Supplies",
    "Other Expense",
  ],
};

export const MOCK_COMPANY: Company = {
  id: "co_01",
  name: "Acme Corp",
  currency: "USD",
  joinCode: "ACME-2024",
};

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: "t1", title: "Monthly Salary", amount: 12000, category: "Salary", type: "income", date: "2024-06-01" },
  { id: "t2", title: "Freelance Project A", amount: 3500, category: "Freelance", type: "income", date: "2024-06-05" },
  { id: "t3", title: "AWS Infrastructure", amount: 2100, category: "Software", type: "expense", date: "2024-06-06" },
  { id: "t4", title: "Team Payroll", amount: 18000, category: "Payroll", type: "expense", date: "2024-06-10" },
  { id: "t5", title: "Google Ads", amount: 1500, category: "Marketing", type: "expense", date: "2024-06-11" },
  { id: "t6", title: "Consulting Income", amount: 6000, category: "Freelance", type: "income", date: "2024-06-12" },
  { id: "t7", title: "Office Rent", amount: 3200, category: "Office", type: "expense", date: "2024-06-15" },
  { id: "t8", title: "Investment Return", amount: 4500, category: "Investment", type: "income", date: "2024-06-18" },
  { id: "t9", title: "Business Travel", amount: 890, category: "Travel", type: "expense", date: "2024-06-20" },
  { id: "t10", title: "Quarterly Bonus", amount: 5000, category: "Bonus", type: "income", date: "2024-06-22" },
  { id: "t11", title: "Software Licenses", amount: 650, category: "Software", type: "expense", date: "2024-06-23" },
  { id: "t12", title: "Tax Payment Q2", amount: 4200, category: "Tax", type: "expense", date: "2024-06-28" },
];

export const MONTHLY_CHART_DATA = [
  { month: "Jan", income: 18000, expense: 12000 },
  { month: "Feb", income: 21000, expense: 14500 },
  { month: "Mar", income: 19500, expense: 13200 },
  { month: "Apr", income: 24000, expense: 16000 },
  { month: "May", income: 22500, expense: 15800 },
  { month: "Jun", income: 31000, expense: 30540 },
];

export function formatCurrency(amount: number, currency = "USD") {
  // IDR pakai locale id-ID agar tampil: Rp 1.000.000
  if (currency === "IDR") {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  }
  // JPY juga tidak pakai desimal
  if (currency === "JPY") {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
