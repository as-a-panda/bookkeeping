import { useState, useEffect, FormEvent } from 'react';
import { recurringApi, accountApi, categoryApi } from '../api';
import type { RecurringRule, Account, Category } from '../types';

const FREQ_LABELS: Record<string, string> = {
  DAILY: '每天', WEEKLY: '每周', MONTHLY: '每月', YEARLY: '每年',
};

export default function Recurring() {
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({
    frequency: 'MONTHLY', interval: 1, nextDate: new Date().toISOString().slice(0, 10),
    transactionTemplate: { accountId: '', categoryId: '', type: 'EXPENSE', amount: '', description: '' },
  });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [ruleRes, acctRes, catRes] = await Promise.all([
      recurringApi.list(),
      accountApi.list(),
      categoryApi.list(),
    ]);
    setRules(ruleRes.data);
    setAccounts(acctRes.data);
    setCategories(catRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const template = form.transactionTemplate;
    if (!template.accountId || !template.categoryId || !template.amount) return;

    await recurringApi.create({
      frequency: form.frequency,
      interval: form.interval,
      nextDate: form.nextDate,
      transactionTemplate: {
        ...template,
        accountId: Number(template.accountId),
        categoryId: Number(template.categoryId),
        amount: Number(template.amount),
      },
    });
    setShowForm(false);
    fetchData();
  };

  const toggleActive = async (rule: RecurringRule) => {
    await recurringApi.update(rule.id, { active: !rule.active });
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除？')) return;
    await recurringApi.delete(id);
    fetchData();
  };

  if (loading) return <div className="text-center py-8">加载中...</div>;

  const filteredCategories = categories.filter(c => c.type === (form.transactionTemplate.type || 'EXPENSE'));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">定期账单</h2>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          + 添加规则
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border text-center">
          <p className="text-gray-400">暂无定期账单规则</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => {
            const tpl = typeof rule.transactionTemplate === 'string' ? JSON.parse(rule.transactionTemplate) : rule.transactionTemplate;
            return (
              <div key={rule.id} className={`bg-white p-4 rounded-xl shadow-sm border ${!rule.active ? 'opacity-60' : ''}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{tpl.description || '定期账单'} <span className="text-xs text-gray-400 ml-2">¥{tpl.amount}</span></p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      每{FREQ_LABELS[rule.frequency] || rule.frequency}{rule.interval > 1 ? ` (每${rule.interval}次)` : ''} · 下次: {rule.nextDate?.slice(0, 10)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleActive(rule)}
                      className={`text-xs px-2 py-1 rounded-lg ${rule.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {rule.active ? '启用' : '暂停'}
                    </button>
                    <button onClick={() => handleDelete(rule.id)} className="text-xs text-red-500 hover:underline">删除</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-4">添加定期规则</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex bg-gray-100 rounded-lg p-1">
                {['EXPENSE', 'INCOME'].map(type => (
                  <button key={type} type="button"
                    onClick={() => setForm({ ...form, transactionTemplate: { ...form.transactionTemplate, type } })}
                    className={`flex-1 py-2 rounded-md text-sm font-medium ${form.transactionTemplate.type === type ? (type === 'EXPENSE' ? 'bg-red-500 text-white' : 'bg-green-500 text-white') : 'text-gray-500'}`}>
                    {type === 'EXPENSE' ? '支出' : '收入'}
                  </button>
                ))}
              </div>
              <select value={form.transactionTemplate.categoryId} onChange={e => setForm({ ...form, transactionTemplate: { ...form.transactionTemplate, categoryId: e.target.value } })}
                className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">选择分类</option>
                {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={form.transactionTemplate.accountId} onChange={e => setForm({ ...form, transactionTemplate: { ...form.transactionTemplate, accountId: e.target.value } })}
                className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">选择账户</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <input type="number" step="0.01" placeholder="金额" value={form.transactionTemplate.amount}
                onChange={e => setForm({ ...form, transactionTemplate: { ...form.transactionTemplate, amount: e.target.value } })}
                className="w-full px-3 py-2 border rounded-lg text-sm" required />
              <input placeholder="描述" value={form.transactionTemplate.description}
                onChange={e => setForm({ ...form, transactionTemplate: { ...form.transactionTemplate, description: e.target.value } })}
                className="w-full px-3 py-2 border rounded-lg text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}
                  className="px-3 py-2 border rounded-lg text-sm">
                  <option value="DAILY">每天</option>
                  <option value="WEEKLY">每周</option>
                  <option value="MONTHLY">每月</option>
                  <option value="YEARLY">每年</option>
                </select>
                <input type="number" placeholder="间隔" value={form.interval}
                  onChange={e => setForm({ ...form, interval: Number(e.target.value) })}
                  className="px-3 py-2 border rounded-lg text-sm" min="1" />
              </div>
              <input type="date" value={form.nextDate}
                onChange={e => setForm({ ...form, nextDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm" required />
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
