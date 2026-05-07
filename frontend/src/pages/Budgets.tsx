import { useState, useEffect, FormEvent } from 'react';
import { budgetApi, categoryApi, statsApi } from '../api';
import type { Budget, Category } from '../types';

export default function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ categoryId: '', amount: '', period: 'MONTHLY', startDate: new Date().toISOString().slice(0, 7) + '-01' });
  const [expenses, setExpenses] = useState<Map<number | string, number>>(new Map());
  const [loading, setLoading] = useState(true);

  const currentMonth = new Date().toISOString().slice(0, 7);

  const fetchData = async () => {
    const [budgetRes, catRes, statsRes] = await Promise.all([
      budgetApi.list(),
      categoryApi.list(),
      statsApi.byCategory({ startDate: `${currentMonth}-01`, endDate: `${currentMonth}-31`, type: 'EXPENSE' }),
    ]);
    setBudgets(budgetRes.data);
    setCategories(catRes.data.filter((c: Category) => c.type === 'EXPENSE'));

    const expenseMap = new Map<string | number, number>();
    statsRes.data.forEach((s: any) => expenseMap.set(s.categoryId, s.total));
    setExpenses(expenseMap);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.startDate) return;
    await budgetApi.create({
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      amount: Number(form.amount),
      period: form.period,
      startDate: form.startDate,
    });
    setShowForm(false);
    setForm({ categoryId: '', amount: '', period: 'MONTHLY', startDate: new Date().toISOString().slice(0, 7) + '-01' });
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除该预算？')) return;
    await budgetApi.delete(id);
    fetchData();
  };

  if (loading) return <div className="text-center py-8">加载中...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">预算管理</h2>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          + 添加预算
        </button>
      </div>

      {budgets.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border text-center">
          <p className="text-gray-400">暂无预算</p>
          <button onClick={() => setShowForm(true)} className="text-blue-600 text-sm hover:underline mt-2">添加预算</button>
        </div>
      ) : (
        <div className="space-y-4">
          {budgets.map((budget) => {
            const spent = budget.categoryId ? (expenses.get(budget.categoryId) || 0) : Array.from(expenses.values()).reduce((a, b) => a + b, 0);
            const pct = Math.min(100, Math.round((spent / budget.amount) * 100));
            const isOver = spent > budget.amount;

            return (
              <div key={budget.id} className="bg-white p-5 rounded-xl shadow-sm border">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <span className="font-semibold">{budget.category?.name || '总预算'}</span>
                    <span className="text-xs text-gray-400 ml-2">{budget.period === 'MONTHLY' ? '月度' : '年度'}</span>
                  </div>
                  <button onClick={() => handleDelete(budget.id)} className="text-xs text-red-500 hover:underline">删除</button>
                </div>
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                  <span>已使用 ¥{spent.toFixed(2)}</span>
                  <span>预算 ¥{budget.amount.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className={`h-2.5 rounded-full transition-all ${isOver ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }}></div>
                </div>
                <p className={`text-xs mt-1 ${isOver ? 'text-red-500' : 'text-gray-400'}`}>
                  {isOver ? `已超支 ¥${(spent - budget.amount).toFixed(2)}` : `剩余 ¥${(budget.amount - spent).toFixed(2)}`}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-4">添加预算</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 block mb-1">分类（留空为总预算）</label>
                <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">总预算</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">预算金额 *</label>
                <input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" required />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">周期</label>
                <select value={form.period} onChange={e => setForm({ ...form, period: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="MONTHLY">月度</option>
                  <option value="YEARLY">年度</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">开始日期 *</label>
                <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" required />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50">取消</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">添加</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
