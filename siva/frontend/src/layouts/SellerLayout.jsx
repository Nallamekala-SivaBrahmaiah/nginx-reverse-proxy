import React from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../redux/authSlice.js';
import { toggleTheme } from '../redux/themeSlice.js';
import {
  LayoutDashboard,
  ShoppingBag,
  PlusCircle,
  TrendingUp,
  Tag,
  LogOut,
  User,
  ArrowLeft,
  Moon,
  Sun,
  Menu,
} from 'lucide-react';
import toast from 'react-hot-toast';

const SellerLayout = () => {
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
    { label: 'Dashboard', path: '/seller', icon: LayoutDashboard },
    { label: 'Manage Products', path: '/seller/products', icon: ShoppingBag },
    { label: 'Add Product', path: '/seller/add-product', icon: PlusCircle },
    { label: 'Orders', path: '/seller/orders', icon: TrendingUp },
    { label: 'Coupons', path: '/seller/coupons', icon: Tag },
  ];

  return (
    <div className={`min-h-screen flex ${darkMode ? 'dark bg-zinc-950 text-zinc-100' : 'bg-gray-100 text-zinc-900'}`}>
      
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 text-white flex flex-col border-r border-zinc-800">
        <div className="p-6 border-b border-zinc-800">
          <Link to="/" className="flex items-center gap-2">
            <ArrowLeft size={16} className="text-gray-400 hover:text-white" />
            <span className="text-lg font-bold tracking-wider text-secondary">Seller Hub</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-red-400 hover:bg-zinc-800 hover:text-red-300 transition"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center dark:bg-zinc-900 dark:border-zinc-800">
          <h1 className="text-xl font-bold dark:text-white">
            {navItems.find((n) => n.path === location.pathname)?.label || 'Seller Panel'}
          </h1>

          <div className="flex items-center gap-6">
            <button
              onClick={() => dispatch(toggleTheme())}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="flex items-center gap-3">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-500 flex items-center justify-center font-bold text-sm">
                  {user.name[0].toUpperCase()}
                </div>
              )}
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

export default SellerLayout;
