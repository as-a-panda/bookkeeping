import { useState, useEffect, FormEvent } from 'react';
import { accountApi } from '../api';
import type { Account } from '../types';

const ACCOUNT_TYPES = [
  { value: 'CASH', label: '现金' },
  { value: 'BANK', label: '银行卡' },
  { value: 'CREDIT_CARD', label: '信用卡' },
  { value: 'ALIPAY', label: '支付宝' },
  { value: 'WECHAT', label: '微信' },
  { value: 'OTHER', label: '其他' },
];

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [form, setForm] = useState({ name: '', type: 'CASH', balance: '', currency: 'CNY' });
  const [loading, setLoading] = useState(true);

  const fetchAccounts = async () => {
    const res = await accountApi.list();
    setAccounts(res.data);
    setLoading(false);
  };

  useEffect(() => { fetchAccounts(); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.type) return;

    if (editing) {
      await accountApi.update(editing.id, {
        name: form.name,
        type: form.type,
        balance: Number(form.balance),
        currency: form.currency,
      });
    } else {
      await accountApi.create({
        name: form.name,
        type: form.type,
        balance: Number(form.balance),
        currency: form.currency,
      });
    }

    setShowForm(false);
    setEditing(null);
    setForm({ name: '', type: 'CASH', balance: '', currency: 'CNY' });
    fetchAccounts();
  };

  const handleEdit = (account: Account) => {
    setEditing(account);
    setForm({ name: account.name, type: account.type, balance: String(account.balance), currency: account.currency });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除该账户？')) return;
    await accountApi.delete(id);
    fetchAccounts();
  };

  const typeLabel = (v: string) => ACCOUNT_TYPES.find(t => t.value === v)?.label || v;

  if (loading) return <div className="text-center py-8">加载中...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">账户管理</h2>
        <button onClick={() => { setEditing(null); setForm({ name: '', type: 'CASH', balance: '', currency: 'CNY' }); setShowForm(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          + 添加账户
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acct) => (
          <div key={acct.id} className="bg-white p-5 rounded-xl shadow-sm border">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{acct.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{typeLabel(acct.type)}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(acct)} className="text-xs text-blue-500 hover:underline">编辑</button>
                <button onClick={() => handleDelete(acct.id)} className="text-xs text-red-500 hover:underline">删除</button>
              </div>
            </div>
            <p className="text-2xl font-bold mt-3">¥{acct.balance.toFixed(2)}</p>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-4">{editing ? '编辑账户' : '添加账户'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="账户名称" required />
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm">
                {ACCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <input type="number" step="0.01" value={form.balance} onChange={e => setForm({ ...form, balance: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="初始余额" />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50">取消</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                  {editing ? '保存' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
