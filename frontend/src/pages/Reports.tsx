import { useState, useEffect } from 'react';
import { statsApi, exportApi } from '../api';
import type { CategorySummary, MonthlySummary } from '../types';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, BarChart, Bar,
} from 'recharts';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

export default function Reports() {
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [monthly, setMonthly] = useState<MonthlySummary[]>([]);
  const [incomeByCategory, setIncomeByCategory] = useState<CategorySummary[]>([]);
  const [expenseByCategory, setExpenseByCategory] = useState<CategorySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      statsApi.byMonth({ startDate: `${year}-01-01`, endDate: `${year}-12-31` }),
      statsApi.byCategory({ startDate: `${year}-01-01`, endDate: `${year}-12-31`, type: 'INCOME' }),
      statsApi.byCategory({ startDate: `${year}-01-01`, endDate: `${year}-12-31`, type: 'EXPENSE' }),
    ]).then(([monthlyRes, incomeRes, expenseRes]) => {
      setMonthly(monthlyRes.data);
      setIncomeByCategory(incomeRes.data);
      setExpenseByCategory(expenseRes.data);
    }).finally(() => setLoading(false));
  }, [year]);

  const handleExport = async () => {
    try {
      const res = await exportApi.csv({ startDate: `${year}-01-01`, endDate: `${year}-12-31` });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookkeeping_${year}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('导出失败');
    }
  };

  if (loading) return <div className="text-center py-8">加载中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">统计报表</h2>
        <div className="flex gap-2">
          <select value={year} onChange={e => setYear(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}年</option>)}
          </select>
          <button onClick={handleExport} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            导出 CSV
          </button>
        </div>
      </div>

      {/* Monthly Bar Chart */}
      <div className="bg-white p-5 rounded-xl shadow-sm border">
        <h3 className="font-semibold mb-4">月度收支趋势 ({year})</h3>
        {monthly.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => `¥${value.toFixed(2)}`} />
              <Legend />
              <Bar dataKey="income" name="收入" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="支出" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center py-8 text-gray-400">暂无数据</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense by Category */}
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <h3 className="font-semibold mb-4">支出分类占比</h3>
          {expenseByCategory.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={expenseByCategory} dataKey="total" nameKey="categoryName" cx="50%" cy="50%" outerRadius={100}>
                    {expenseByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => `¥${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {expenseByCategory.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                      {item.categoryName}
                    </span>
                    <span className="text-gray-600">¥{item.total.toFixed(2)} ({item.percentage}%)</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center py-8 text-gray-400">暂无支出数据</p>
          )}
        </div>

        {/* Income by Category */}
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <h3 className="font-semibold mb-4">收入分类占比</h3>
          {incomeByCategory.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={incomeByCategory} dataKey="total" nameKey="categoryName" cx="50%" cy="50%" outerRadius={100}>
                    {incomeByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => `¥${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {incomeByCategory.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                      {item.categoryName}
                    </span>
                    <span className="text-gray-600">¥{item.total.toFixed(2)} ({item.percentage}%)</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center py-8 text-gray-400">暂无收入数据</p>
          )}
        </div>
      </div>
    </div>
  );
}
