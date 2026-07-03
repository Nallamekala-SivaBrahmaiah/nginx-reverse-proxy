import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Layouts
import CustomerLayout from './layouts/CustomerLayout.jsx';
import SellerLayout from './layouts/SellerLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import AuthLayout from './layouts/AuthLayout.jsx';

// Guards
import { ProtectedRoute, PublicRoute, SellerRoute, AdminRoute } from './components/RouteGuards.jsx';

// Pages
import Home from './pages/Home.jsx';
import ProductCatalog from './pages/ProductCatalog.jsx';
import ProductDetails from './pages/ProductDetails.jsx';
import Cart from './pages/Cart.jsx';
import Wishlist from './pages/Wishlist.jsx';
import Checkout from './pages/Checkout.jsx';
import CustomerDashboard from './pages/CustomerDashboard.jsx';

// Auth Pages
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import VerifyOtp from './pages/VerifyOtp.jsx';

// Seller Pages
import SellerDashboard from './pages/seller/SellerDashboard.jsx';
import SellerProducts from './pages/seller/SellerProducts.jsx';
import SellerAddProduct from './pages/seller/SellerAddProduct.jsx';
import SellerOrders from './pages/seller/SellerOrders.jsx';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminCustomers from './pages/admin/AdminCustomers.jsx';
import AdminSellers from './pages/admin/AdminSellers.jsx';
import AdminCategories from './pages/admin/AdminCategories.jsx';
import AdminBanners from './pages/admin/AdminBanners.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const AppContent = () => {
  const { darkMode } = useSelector((state) => state.theme);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Routes>
        
        {/* Auth guest-only routes */}
        <Route element={<PublicRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-email" element={<VerifyOtp />} />
          </Route>
        </Route>

        {/* Customer storefront layout routes */}
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductCatalog />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />

          {/* Customer logged in only */}
          <Route element={<ProtectedRoute />}>
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/dashboard" element={<CustomerDashboard />} />
          </Route>
        </Route>

        {/* Seller hub panel layout routes */}
        <Route element={<SellerRoute />}>
          <Route element={<SellerLayout />}>
            <Route path="/seller" element={<SellerDashboard />} />
            <Route path="/seller/products" element={<SellerProducts />} />
            <Route path="/seller/add-product" element={<SellerAddProduct />} />
            <Route path="/seller/edit-product/:id" element={<SellerAddProduct />} />
            <Route path="/seller/orders" element={<SellerOrders />} />
          </Route>
        </Route>

        {/* Admin control panel layout routes */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/customers" element={<AdminCustomers />} />
            <Route path="/admin/sellers" element={<AdminSellers />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/banners" element={<AdminBanners />} />
          </Route>
        </Route>

        {/* Wildcard redirects */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppContent />
  </QueryClientProvider>
);

export default App;
