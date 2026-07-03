import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Outlet, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme } from '../redux/themeSlice.js';
import { logoutUser } from '../redux/authSlice.js';
import { clearCartLocal } from '../redux/cartSlice.js';
import {
  ShoppingCart,
  Search,
  Heart,
  User,
  Moon,
  Sun,
  Menu,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  Bell,
} from 'lucide-react';
import API from '../services/api.js';
import toast from 'react-hot-toast';

const CustomerLayout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { darkMode } = useSelector((state) => state.theme);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { items: cartItems } = useSelector((state) => state.cart);

  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [categories, setCategories] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    // Fetch categories for subheader
    const fetchCats = async () => {
      try {
        const res = await API.get('/marketing/categories');
        setCategories(res.data.categories.filter((c) => !c.parent));
      } catch (err) {
        console.error(err);
      }
    };
    fetchCats();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchNotifications = async () => {
        try {
          const res = await API.get('/notifications');
          setNotifications(res.data.notifications);
        } catch (err) {
          console.error(err);
        }
      };
      fetchNotifications();
    }
  }, [isAuthenticated]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      navigate(`/products?keyword=${encodeURIComponent(keyword)}`);
    } else {
      navigate('/products');
    }
  };

  const handleLogout = async () => {
    try {
      await API.post('/auth/logout');
      dispatch(logoutUser());
      dispatch(clearCartLocal());
      toast.success('Logged out successfully');
      navigate('/');
    } catch (err) {
      toast.error('Logout failed');
    }
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  const markAllRead = async () => {
    try {
      await API.put('/notifications/mark-all-read');
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark bg-zinc-950 text-zinc-100' : 'bg-gray-50 text-zinc-900'}`}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-primary-500 text-white shadow-md dark:bg-zinc-900 dark:border-b dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          
          {/* Logo */}
          <Link to="/" className="flex flex-col items-start leading-none">
            <span className="text-xl font-bold italic tracking-wide">Flipkart</span>
            <span className="text-xs text-secondary font-medium italic flex items-center gap-0.5">
              Explore <span className="text-white font-bold">Plus</span>
            </span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl relative">
            <div className="flex items-center bg-white rounded-sm overflow-hidden text-zinc-900 shadow-inner dark:bg-zinc-800 dark:text-zinc-100">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search for products, brands and more"
                className="w-full px-4 py-2 text-sm focus:outline-none bg-transparent"
              />
              <button type="submit" className="px-4 text-primary-500 hover:text-primary-600 dark:text-zinc-400">
                <Search size={18} />
              </button>
            </div>
          </form>

          {/* Nav Icons */}
          <div className="flex items-center gap-6">
            {/* Theme Toggle */}
            <button
              onClick={() => dispatch(toggleTheme())}
              className="p-1.5 rounded-full hover:bg-primary-600 dark:hover:bg-zinc-800 transition-colors"
              title="Toggle theme"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Profile Dropdown */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-1 font-medium hover:text-gray-200 focus:outline-none"
                >
                  <User size={18} />
                  <span className="hidden sm:inline text-sm max-w-[100px] truncate">{user.name}</span>
                  <ChevronDown size={14} />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white text-zinc-800 rounded-sm shadow-lg border border-gray-100 overflow-hidden py-1 z-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100">
                    <Link
                      to="/dashboard"
                      onClick={() => setShowDropdown(false)}
                      className="px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 dark:hover:bg-zinc-700"
                    >
                      <User size={16} /> My Profile
                    </Link>
                    {user.role !== 'customer' && (
                      <Link
                        to={user.role === 'admin' ? '/admin' : '/seller'}
                        onClick={() => setShowDropdown(false)}
                        className="px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 dark:hover:bg-zinc-700"
                      >
                        <LayoutDashboard size={16} /> Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600 dark:hover:bg-zinc-700"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-white text-primary-500 font-semibold px-6 py-1 rounded-sm text-sm border hover:bg-gray-50 transition dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-700"
              >
                Login
              </Link>
            )}

            {/* Wishlist */}
            <Link to="/wishlist" className="relative hover:text-gray-200 flex items-center gap-1.5">
              <Heart size={20} />
              <span className="hidden md:inline text-sm font-medium">Wishlist</span>
            </Link>

            {/* Cart */}
            <Link to="/cart" className="relative hover:text-gray-200 flex items-center gap-1.5">
              <div className="relative">
                <ShoppingCart size={20} />
                {cartItems.length > 0 && (
                  <span className="absolute -top-2.5 -right-2 bg-secondary text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-primary-500 dark:border-zinc-900">
                    {cartItems.reduce((acc, curr) => acc + curr.quantity, 0)}
                  </span>
                )}
              </div>
              <span className="hidden md:inline text-sm font-medium">Cart</span>
            </Link>

            {/* Notifications Panel */}
            {isAuthenticated && (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    if (!showNotifications) markAllRead();
                  }}
                  className="relative p-1 hover:text-gray-200"
                >
                  <Bell size={20} />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-red-500 rounded-full ring-2 ring-primary-500 dark:ring-zinc-900" />
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white text-zinc-800 rounded-sm shadow-lg border border-gray-100 overflow-hidden py-1 z-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100">
                    <div className="px-4 py-2 border-b border-gray-100 font-semibold text-sm flex justify-between items-center dark:border-zinc-700">
                      <span>Notifications</span>
                      <button onClick={markAllRead} className="text-xs text-primary-500 hover:underline">Mark all read</button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-xs text-gray-500">No notifications</div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n._id} className={`px-4 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 text-xs dark:border-zinc-700 dark:hover:bg-zinc-700 ${!n.isRead ? 'bg-blue-50/50 dark:bg-zinc-800/50' : ''}`}>
                            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{n.title}</p>
                            <p className="text-gray-500 dark:text-gray-400 mt-0.5">{n.message}</p>
                            <span className="text-[10px] text-gray-400 mt-1 block">{new Date(n.createdAt).toLocaleDateString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </header>

      {/* Categories Strip */}
      <div className="bg-white border-b border-gray-200 py-2.5 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-start gap-8 overflow-x-auto text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          <Link to="/products" className="hover:text-primary-500 whitespace-nowrap">All Products</Link>
          {categories.map((cat) => (
            <Link
              key={cat._id}
              to={`/products?category=${cat._id}`}
              className="hover:text-primary-500 whitespace-nowrap flex items-center gap-1"
            >
              {cat.image && <img src={cat.image} alt={cat.name} className="w-5 h-5 object-contain" />}
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-zinc-900 text-gray-400 text-xs py-10 mt-auto border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="text-zinc-500 font-bold uppercase mb-3">About</h4>
            <ul className="space-y-2">
              <li><Link to="#" className="hover:underline">Contact Us</Link></li>
              <li><Link to="#" className="hover:underline">About Us</Link></li>
              <li><Link to="#" className="hover:underline">Careers</Link></li>
              <li><Link to="#" className="hover:underline">Flipkart Stories</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-zinc-500 font-bold uppercase mb-3">Help</h4>
            <ul className="space-y-2">
              <li><Link to="#" className="hover:underline">Payments</Link></li>
              <li><Link to="#" className="hover:underline">Shipping</Link></li>
              <li><Link to="#" className="hover:underline">Cancellation & Returns</Link></li>
              <li><Link to="#" className="hover:underline">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-zinc-500 font-bold uppercase mb-3">Consumer Policy</h4>
            <ul className="space-y-2">
              <li><Link to="#" className="hover:underline">Cancellation & Returns</Link></li>
              <li><Link to="#" className="hover:underline">Terms of Use</Link></li>
              <li><Link to="#" className="hover:underline">Security</Link></li>
              <li><Link to="#" className="hover:underline">Privacy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-zinc-500 font-bold uppercase mb-3">Office Address</h4>
            <p className="leading-5">
              Flipkart Internet Private Limited,<br />
              Buildings Alyssa, Begonia &<br />
              Clove Embassy Tech Village,<br />
              Bengaluru, Karnataka, India
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-8 pt-8 border-t border-zinc-800 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} FlipkartCloneMERN. Built for demonstration.</p>
          <p className="flex gap-4">
            <Link to="#" className="hover:underline">Terms of Service</Link>
            <Link to="#" className="hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default CustomerLayout;
