
export interface Payment {
  id: string;
  month: number;
  amount: number;
  description?: string;
  debtFunded?: boolean;
}

export interface IncomeItem {
  month: number;
  amount: number;
  type: 'rental' | 'sale';
}

export interface ExpenseItem {
  month: number;
  amount: number;
  type: 'operating' | 'interest' | 'selling';
}

export interface ProjectData {
  projectName: string;
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
