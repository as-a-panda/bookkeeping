import api from './client';
import type {
  User, Account, Category, Tag, Transaction, RecurringRule,
  Budget, BillSplit, TransactionFilter, PaginatedResponse,
  SummaryStats, CategorySummary, MonthlySummary
} from '../types';

// Auth
export const authApi = {
  register: (data: { email: string; username: string; password: string }) =>
    api.post<{ token: string; user: User }>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<{ token: string; user: User }>('/auth/login', data),
  me: () => api.get<User>('/auth/me'),
};

// Accounts
export const accountApi = {
  list: () => api.get<Account[]>('/accounts'),
  create: (data: Omit<Account, 'id' | 'userId' | 'createdAt'>) =>
    api.post<Account>('/accounts', data),
  update: (id: number, data: Partial<Account>) =>
    api.put<Account>(`/accounts/${id}`, data),
  delete: (id: number) => api.delete(`/accounts/${id}`),
};

// Categories
export const categoryApi = {
  list: () => api.get<Category[]>('/categories'),
  create: (data: { name: string; type: string; icon?: string; parentId?: number }) =>
    api.post<Category>('/categories', data),
  update: (id: number, data: Partial<Category>) =>
    api.put<Category>(`/categories/${id}`, data),
  delete: (id: number) => api.delete(`/categories/${id}`),
};

// Tags
export const tagApi = {
  list: () => api.get<Tag[]>('/tags'),
  create: (data: { name: string; color?: string }) =>
    api.post<Tag>('/tags', data),
  delete: (id: number) => api.delete(`/tags/${id}`),
};

// Transactions
export const transactionApi = {
  list: (filter?: TransactionFilter) =>
    api.get<PaginatedResponse<Transaction>>('/transactions', { params: filter }),
  getById: (id: number) => api.get<Transaction>(`/transactions/${id}`),
  create: (data: any) => api.post<Transaction>('/transactions', data),
  update: (id: number, data: any) =>
    api.put<Transaction>(`/transactions/${id}`, data),
  delete: (id: number) => api.delete(`/transactions/${id}`),
};

// Stats
export const statsApi = {
  summary: (params?: { startDate?: string; endDate?: string }) =>
    api.get<SummaryStats>('/transactions/stats/summary', { params }),
  byCategory: (params?: { startDate?: string; endDate?: string; type?: string }) =>
    api.get<CategorySummary[]>('/transactions/stats/by-category', { params }),
  byMonth: (params?: { startDate?: string; endDate?: string }) =>
    api.get<MonthlySummary[]>('/transactions/stats/by-month', { params }),
};

// Recurring
export const recurringApi = {
  list: () => api.get<RecurringRule[]>('/recurring'),
  create: (data: any) => api.post<RecurringRule>('/recurring', data),
  update: (id: number, data: any) =>
    api.put<RecurringRule>(`/recurring/${id}`, data),
  delete: (id: number) => api.delete(`/recurring/${id}`),
};

// Budgets
export const budgetApi = {
  list: () => api.get<Budget[]>('/budgets'),
  create: (data: any) => api.post<Budget>('/budgets', data),
  update: (id: number, data: any) =>
    api.put<Budget>(`/budgets/${id}`, data),
  delete: (id: number) => api.delete(`/budgets/${id}`),
};

// Bill Splits
export const billSplitApi = {
  create: (data: any) => api.post<BillSplit>('/bill-splits', data),
  settle: (id: number, participantIndex: number) =>
    api.put(`/bill-splits/${id}/settle/${participantIndex}`),
  delete: (id: number) => api.delete(`/bill-splits/${id}`),
};

// Export
export const exportApi = {
  csv: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/export/csv', { params, responseType: 'blob' }),
};
