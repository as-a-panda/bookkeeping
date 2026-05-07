import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { transactionApi, accountApi, categoryApi } from '../api';
import type { Transaction, Account, Category, TransactionFilter } from '../types';

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TransactionFilter>({ pageSize: 15 });
  const [showFilter, setShowFilter] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [txRes, acctRes, catRes] = await Promise.all([
        transactionApi.list({ ...filter, page }),
        accountApi.list(),
        categoryApi.list(),
      ]);
      setTransactions(txRes.data.data);
      setTotal(txRes.data.total);
      setPage(txRes.data.page);
      setTotalPages(txRes.data.totalPages);
      setAccounts(acctRes.data);
      setCategories(catRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, filter]);

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除这条记录？')) return;
    await transactionApi.delete(id);
    fetchData();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">交易记录</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowFilter(!showFilter)} className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
            {showFilter ? '收起筛选' : '筛选'}
          </button>
          <Link to="/transactions/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            + 记一笔
          </Link>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilter && (
        <div className="bg-white p-4 rounded-xl shadow-sm border mb-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <select
              value={filter.type || ''}
              onChange={(e) => setFilter({ ...filter, type: e.target.value || undefined, page: undefined } as any)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">所有类型</option>
              <option value="INCOME">收入</option>
              <option value="EXPENSE">支出</option>
            </select>
            <select
              value={filter.categoryId || ''}
              onChange={(e) => setFilter({ ...filter, categoryId: e.target.value ? Number(e.target.value) : undefined, page: undefined } as any)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">所有分类</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <select
              value={filter.accountId || ''}
              onChange={(e) => setFilter({ ...filter, accountId: e.target.value ? Number(e.target.value) : undefined, page: undefined } as any)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">所有账户</option>
              {accounts.map((acct) => (
                <option key={acct.id} value={acct.id}>{acct.name}</option>
              ))}
            </select>
            <input
              type="month"
              value={filter.startDate?.slice(0, 7) || ''}
              onChange={(e) => {
                const month = e.target.value;
                if (month) {
                  setFilter({ ...filter, startDate: `${month}-01`, endDate: `${month}-31`, page: undefined } as any);
                } else {
                  setFilter({ ...filter, startDate: undefined, endDate: undefined, page: undefined } as any);
                }
              }}
              className="px-3 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>
      )}

      {/* Transaction List */}
      {loading ? (
        <div className="text-center py-8">加载中...</div>
      ) : transactions.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border text-center">
          <p className="text-gray-400">暂无交易记录</p>
          <Link to="/transactions/new" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
            记第一笔账
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="divide-y">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm ${
                    tx.type === 'INCOME' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {tx.type === 'INCOME' ? '收' : '支'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{tx.category?.name}</span>
                      <span className="text-xs text-gray-400">{tx.account?.name}</span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{tx.description || tx.note || tx.date?.slice(0, 10)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-semibold text-sm ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'}¥{tx.amount.toFixed(2)}
                  </span>
                  <div className="flex gap-1">
                    <Link to={`/transactions/${tx.id}/edit`} className="text-xs text-blue-500 hover:underline px-1">编辑</Link>
                    <button onClick={() => handleDelete(tx.id)} className="text-xs text-red-500 hover:underline px-1">删除</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 text-sm">
          <span className="text-gray-500">共 {total} 条</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              上一页
            </button>
            <span className="px-3 py-1">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
