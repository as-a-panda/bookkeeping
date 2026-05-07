import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { transactionApi, accountApi, categoryApi } from '../api';
import type { Account, Category } from '../types';
import dayjs from 'dayjs';

export default function TransactionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    type: 'EXPENSE',
    accountId: '',
    categoryId: '',
    amount: '',
    date: dayjs().format('YYYY-MM-DD'),
    description: '',
    note: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([accountApi.list(), categoryApi.list()]).then(([acctRes, catRes]) => {
      setAccounts(acctRes.data);
      setCategories(catRes.data);
    });
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      transactionApi.getById(Number(id)).then((res) => {
        const tx = res.data;
        setForm({
          type: tx.type,
          accountId: String(tx.accountId),
          categoryId: String(tx.categoryId),
          amount: String(tx.amount),
          date: tx.date?.slice(0, 10),
          description: tx.description || '',
          note: tx.note || '',
        });
      });
    }
  }, [isEdit, id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.accountId || !form.categoryId || !form.amount || !form.date) {
      setError('请填写必填字段');
      return;
    }

    setLoading(true);
    try {
      const data = {
        ...form,
        accountId: Number(form.accountId),
        categoryId: Number(form.categoryId),
        amount: Number(form.amount),
      };

      if (isEdit) {
        await transactionApi.update(Number(id), data);
      } else {
        await transactionApi.create(data);
      }
      navigate('/transactions');
    } catch (err: any) {
      setError(err.response?.data?.error || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === form.type);

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-6">{isEdit ? '编辑交易' : '记一笔'}</h2>

      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
        {/* Type Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {['EXPENSE', 'INCOME'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setForm({ ...form, type })}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                form.type === type
                  ? type === 'EXPENSE' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                  : 'text-gray-500'
              }`}
            >
              {type === 'EXPENSE' ? '支出' : '收入'}
            </button>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">金额 *</label>
          <input
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">分类 *</label>
          <select
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">选择分类</option>
            {filteredCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">账户 *</label>
          <select
            value={form.accountId}
            onChange={(e) => setForm({ ...form, accountId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">选择账户</option>
            {accounts.map((acct) => (
              <option key={acct.id} value={acct.id}>{acct.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">日期 *</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="如：午餐、打车费..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
          <textarea
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            placeholder="备注信息..."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
          >
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  );
}
