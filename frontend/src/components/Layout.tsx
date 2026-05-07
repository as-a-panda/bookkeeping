import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { path: '/', label: '首页', icon: '📊' },
  { path: '/transactions', label: '交易', icon: '📝' },
  { path: '/accounts', label: '账户', icon: '💰' },
  { path: '/categories', label: '分类', icon: '🏷️' },
  { path: '/budgets', label: '预算', icon: '🎯' },
  { path: '/recurring', label: '定期', icon: '🔄' },
  { path: '/reports', label: '报表', icon: '📈' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <h1 className="text-xl font-bold text-blue-600">记账本</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.username}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-red-500 transition-colors"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar */}
        <aside className="w-56 bg-white shadow-sm min-h-[calc(100vh-3.5rem)] border-r hidden md:block">
          <nav className="p-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <span>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Bottom mobile nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-10">
          <div className="flex justify-around py-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 px-2 py-1 text-xs ${
                    isActive ? 'text-blue-600' : 'text-gray-500'
                  }`
                }
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
