import { useState, useEffect } from 'react';
import { statsApi, transactionApi, accountApi } from '../api';
import type { SummaryStats, MonthlySummary, CategorySummary, Transaction, Account } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];
const CURRENT_MONTH = new Date().toISOString().slice(0, 7);

export default function Dashboard() {
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [monthly, setMonthly] = useState<MonthlySummary[]>([]);
  const [expenseByCategory, setExpenseByCategory] = useState<CategorySummary[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      statsApi.summary({ startDate: `${CURRENT_MONTH}-01`, endDate: `${CURRENT_MONTH}-31` }),
      statsApi.byMonth({ startDate: `${Number(CURRENT_MONTH.slice(0, 4))-1}-${CURRENT_MONTH.slice(5)}`, endDate: `${CURRENT_MONTH}-31` }),
      statsApi.byCategory({ startDate: `${CURRENT_MONTH}-01`, endDate: `${CURRENT_MONTH}-31`, type: 'EXPENSE' }),
      transactionApi.list({ pageSize: '5' as any }),
      accountApi.list(),
    ]).then(([summaryRes, monthlyRes, categoryRes, txRes, acctRes]) => {
      setSummary(summaryRes.data);
      setMonthly(monthlyRes.data);
      setExpenseByCategory(categoryRes.data);
      setRecentTransactions(txRes.data.data);
      setAccounts(acctRes.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8">加载中...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">本月概览</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">收入</p>
          <p className="text-2xl font-bold text-green-600">¥{summary?.totalIncome.toFixed(2)}</p>
          <p className="text-xs text-gray-400">{summary?.incomeCount} 笔</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">支出</p>
          <p className="text-2xl font-bold text-red-600">¥{summary?.totalExpense.toFixed(2)}</p>
          <p className="text-xs text-gray-400">{summary?.expenseCount} 笔</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">净收入</p>
          <p className={`text-2xl font-bold ${(summary?.netAmount || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            ¥{summary?.netAmount.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Accounts */}
      <div className="bg-white p-5 rounded-xl shadow-sm border">
        <h3 className="font-semibold mb-3">账户余额</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {accounts.map((acct) => (
            <div key={acct.id} className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500">{acct.name}</p>
              <p className="text-lg font-semibold">¥{acct.balance.toFixed(2)}</p>
            </div>
          ))}
          {accounts.length === 0 && <p className="text-sm text-gray-400 col-span-full">暂无账户，请先在"账户"页面添加</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Pie Chart */}
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <h3 className="font-semibold mb-3">本月支出分类</h3>
          {expenseByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={expenseByCategory} dataKey="total" nameKey="categoryName" cx="50%" cy="50%" outerRadius={100}>
                  {expenseByCategory.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `¥${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">本月暂无支出</p>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {expenseByCategory.slice(0, 6).map((item, i) => (
              <span key={i} className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                {item.categoryName} {item.percentage}%
              </span>
            ))}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <h3 className="font-semibold mb-3">月度趋势</h3>
          {monthly.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => `¥${value.toFixed(2)}`} />
                <Line type="monotone" dataKey="income" stroke="#10b981" name="收入" strokeWidth={2} />
                <Line type="monotone" dataKey="expense" stroke="#ef4444" name="支出" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">暂无数据</p>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white p-5 rounded-xl shadow-sm border">
        <h3 className="font-semibold mb-3">近期交易</h3>
        {recentTransactions.length > 0 ? (
          <div className="divide-y">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex justify-between items-center py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${tx.type === 'INCOME' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {tx.type === 'INCOME' ? '收入' : '支出'}
                    </span>
                    <span className="font-medium">{tx.category?.name}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {tx.date?.slice(0, 10)} {tx.account?.name} {tx.description && `· ${tx.description}`}
                  </p>
                </div>
                <span className={`font-semibold ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.type === 'INCOME' ? '+' : '-'}¥{tx.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">暂无交易记录</p>
        )}
      </div>
    </div>
  );
}
