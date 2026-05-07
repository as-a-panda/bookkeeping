export interface User {
  id: number;
  email: string;
  username: string;
}

export interface Account {
  id: number;
  userId: number;
  name: string;
  type: string;
  balance: number;
  currency: string;
  createdAt: string;
}

export interface Category {
  id: number;
  userId: number | null;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  icon?: string;
  parentId?: number | null;
  children?: Category[];
}

export interface Tag {
  id: number;
  userId: number;
  name: string;
  color?: string;
}

export interface Transaction {
  id: number;
  userId: number;
  accountId: number;
  account?: Account;
  categoryId: number;
  category?: Category;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  amount: number;
  description?: string;
  date: string;
  note?: string;
  createdAt: string;
  tags?: Tag[];
  billSplit?: BillSplit;
}

export interface RecurringRule {
  id: number;
  userId: number;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval: number;
  nextDate: string;
  endDate?: string;
  transactionTemplate: TransactionTemplate;
  active: boolean;
  createdAt: string;
}

export interface TransactionTemplate {
  accountId: number;
  categoryId: number;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description?: string;
}

export interface Budget {
  id: number;
  userId: number;
  categoryId?: number;
  category?: Category;
  amount: number;
  period: 'MONTHLY' | 'YEARLY';
  startDate: string;
  endDate?: string;
}

export interface BillSplit {
  id: number;
  transactionId: number;
  description: string;
  totalAmount: number;
  participants: Participant[];
  createdAt: string;
}

export interface Participant {
  name: string;
  amount: number;
  settled: boolean;
}

export interface TransactionFilter {
  type?: string;
  categoryId?: number;
  accountId?: number;
  tagId?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SummaryStats {
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  incomeCount: number;
  expenseCount: number;
}

export interface CategorySummary {
  categoryId: number;
  categoryName: string;
  categoryType: string;
  total: number;
  percentage: number;
}

export interface MonthlySummary {
  month: string;
  income: number;
  expense: number;
  net: number;
}
