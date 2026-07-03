import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft } from 'lucide-react';

const AuthLayout = () => {
  const { darkMode } = useSelector((state) => state.theme);

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-200 ${
      darkMode ? 'dark bg-zinc-950 text-zinc-100' : 'bg-gray-100 text-zinc-900'
    }`}>
      
      <div className="w-full max-w-4xl bg-white rounded-sm shadow-lg overflow-hidden flex flex-col md:flex-row min-h-[500px] border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800">
        
        {/* Left Side: Brand Promo (Blue Panel) */}
        <div className="w-full md:w-2/5 bg-primary-500 text-white p-10 flex flex-col justify-between dark:bg-zinc-900 dark:border-r dark:border-zinc-800">
          <div>
            <Link to="/" className="flex items-center gap-1.5 text-white hover:text-gray-100 font-semibold mb-6">
              <ArrowLeft size={16} />
              <span>Back to home</span>
            </Link>
            <h2 className="text-3xl font-bold italic mb-4">Login</h2>
            <p className="text-gray-100 leading-6 text-sm">
              Get access to your Orders, Wishlist and Recommendations.
            </p>
          </div>
          <div className="hidden md:block">
            <img
              src="https://img1a.flixcart.com/www/linchpin/fk-cp-zion/img/login_img_c4a81e.png"
              alt="Flipkart login brand illustration"
              className="w-full max-w-[200px] mx-auto opacity-90"
            />
          </div>
        </div>

        {/* Right Side: Form Content */}
        <div className="w-full md:w-3/5 p-10 flex flex-col justify-center bg-white dark:bg-zinc-900">
          <Outlet />
        </div>

      </div>

    </div>
  );
};

export default AuthLayout;
