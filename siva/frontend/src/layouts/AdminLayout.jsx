import React from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../redux/authSlice.js';
import { toggleTheme } from '../redux/themeSlice.js';
import {
  LayoutDashboard,
  Users,
  Store,
  ShoppingBag,
  Layers,
  FolderOpen,
  Image,
  Tag,
  Star,
  Settings,
  LogOut,
  ArrowLeft,
  Moon,
  Sun,
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminLayout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { darkMode } = useSelector((state) => state.theme);
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logoutUser());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Customers', path: '/admin/customers', icon: Users },
    { label: 'Sellers', path: '/admin/sellers', icon: Store },
    { label: 'Products', path: '/admin/products', icon: ShoppingBag },
    { label: 'Categories', path: '/admin/categories', icon: Layers },
    { label: 'Brands', path: '/admin/brands', icon: FolderOpen },
    { label: 'Banners', path: '/admin/banners', icon: Image },
    { label: 'Coupons', path: '/admin/coupons', icon: Tag },
    { label: 'Reviews', path: '/admin/reviews', icon: Star },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className={`min-h-screen flex ${darkMode ? 'dark bg-zinc-950 text-zinc-100' : 'bg-gray-100 text-zinc-900'}`}>
      
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 text-white flex flex-col border-r border-zinc-800">
        <div className="p-6 border-b border-zinc-800">
          <Link to="/" className="flex items-center gap-2">
            <ArrowLeft size={16} className="text-gray-400 hover:text-white" />
            <span className="text-lg font-bold tracking-wider text-secondary">Control Hub</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-xs font-semibold transition ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800 font-semibold">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-xs text-red-400 hover:bg-zinc-800 hover:text-red-300 transition"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center dark:bg-zinc-900 dark:border-zinc-800">
          <h1 className="text-lg font-bold dark:text-white">
            {navItems.find((n) => n.path === location.pathname)?.label || 'Admin Control'}
          </h1>

          <div className="flex items-center gap-6">
            <button
              onClick={() => dispatch(toggleTheme())}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center font-bold text-sm">
                A
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-bold leading-none">{user.name}</p>
                <span className="text-[10px] text-gray-500 uppercase">{user.role}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>

    </div>
  );
};

export default AdminLayout;
