import { useState, useEffect, FormEvent } from 'react';
import { categoryApi } from '../api';
import type { Category } from '../types';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<{ name: string; type: string; icon: string }>({ name: '', type: 'EXPENSE', icon: '' });
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    const res = await categoryApi.list();
    setCategories(res.data);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name) return;

    if (editing) {
      await categoryApi.update(editing.id, form as any);
    } else {
      await categoryApi.create(form);
    }
    setShowForm(false);
    setEditing(null);
    setForm({ name: '', type: 'EXPENSE', icon: '' });
    fetchCategories();
  };

  const handleEdit = (cat: Category) => {
    setEditing(cat);
    setForm({ name: cat.name, type: cat.type, icon: cat.icon || '' });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除该分类？')) return;
    await categoryApi.delete(id);
    fetchCategories();
  };

  if (loading) return <div className="text-center py-8">加载中...</div>;

  const expenseCategories = categories.filter(c => c.type === 'EXPENSE' && !c.parentId);
  const incomeCategories = categories.filter(c => c.type === 'INCOME' && !c.parentId);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">分类管理</h2>
        <button onClick={() => { setEditing(null); setForm({ name: '', type: 'EXPENSE', icon: '' }); setShowForm(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          + 添加分类
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <h3 className="font-semibold text-red-600 mb-3">支出分类</h3>
          <div className="flex flex-wrap gap-2">
            {expenseCategories.map((cat) => (
              <div key={cat.id} className="group relative">
                <span className="inline-block px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-sm">
                  {cat.name}
                </span>
                <div className="absolute hidden group-hover:flex top-0 right-0 -mt-1 -mr-1 gap-0.5">
                  <button onClick={() => handleEdit(cat)} className="text-[10px] bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center">✎</button>
                  <button onClick={() => handleDelete(cat.id)} className="text-[10px] bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center">×</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <h3 className="font-semibold text-green-600 mb-3">收入分类</h3>
          <div className="flex flex-wrap gap-2">
            {incomeCategories.map((cat) => (
              <div key={cat.id} className="group relative">
                <span className="inline-block px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm">
                  {cat.name}
                </span>
                <div className="absolute hidden group-hover:flex top-0 right-0 -mt-1 -mr-1 gap-0.5">
                  <button onClick={() => handleEdit(cat)} className="text-[10px] bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center">✎</button>
                  <button onClick={() => handleDelete(cat.id)} className="text-[10px] bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center">×</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-4">{editing ? '编辑分类' : '添加分类'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex bg-gray-100 rounded-lg p-1">
                {['EXPENSE', 'INCOME'].map(type => (
                  <button key={type} type="button"
                    onClick={() => setForm({ ...form, type })}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${form.type === type ? (type === 'EXPENSE' ? 'bg-red-500 text-white' : 'bg-green-500 text-white') : 'text-gray-500'}`}>
                    {type === 'EXPENSE' ? '支出' : '收入'}
                  </button>
                ))}
              </div>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="分类名称" required />
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
