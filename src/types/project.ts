
export interface Payment {
  id: string;
  month: number;
  amount: number;
  description?: string;
  debtFunded?: boolean;
  date?: Date | string;
  type?: 'payment' | 'return' | 'interest';
}

export interface IncomeItem {
  id?: string;
  month: number;
  amount: number;
  type: 'rental' | 'sale';
  date?: string | Date;
  description?: string;
}

export interface ExpenseItem {
  month: number;
  amount: number;
  type: 'operating' | 'interest' | 'selling';
}

export interface ProjectData {
  id?: string;
  projectName: string;
  annualInterestRate: number; // Annual interest rate as a percentage (e.g., 12 for 12%)
  purchasePrice: number;
  closingCosts: number;
  renovationCosts: number;
  salePrice: number;
  saleMonth: number;
  sellingCosts: number;
  monthlyInterestRate: number;
  discountRate: number;
  payments: Payment[];
  rentalIncome: IncomeItem[];
  operatingExpenses: ExpenseItem[];
  createdAt?: Date | any; // For Firestore timestamp
  updatedAt?: Date | any; // For Firestore timestamp
  userId?: string; // To associate projects with users
}

export interface CashFlowRow {
  month: number;
  payments: number;
  interest: number;
  rental: number;
  sale: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
  outstandingBalance: number;
}
