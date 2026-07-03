import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../redux/authSlice.js';
import API from '../services/api.js';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error('Please enter all fields');
    }

    setLoading(true);
    try {
      const res = await API.post('/auth/login', { email, password });
      dispatch(setCredentials({ user: res.data.user, token: res.data.token }));
      toast.success('Logged in successfully!');
      
      if (res.data.user.role === 'admin') {
        navigate('/admin');
      } else if (res.data.user.role === 'seller') {
        navigate('/seller');
      } else {
        navigate('/');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      toast.error(msg);
      if (msg.includes('verify your email')) {
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-200 rounded-sm focus:outline-none focus:border-primary-500 bg-transparent text-sm dark:border-zinc-800"
            placeholder="Enter Email"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-200 rounded-sm focus:outline-none focus:border-primary-500 bg-transparent text-sm dark:border-zinc-800"
            placeholder="Enter Password"
          />
        </div>

        <div className="flex justify-end text-xs font-semibold">
          <Link to="/forgot-password" className="text-primary-500 hover:underline">Forgot Password?</Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-secondary text-white font-bold rounded-sm text-sm hover:shadow-md transition duration-200 disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="text-center text-xs font-semibold text-gray-500 border-t border-gray-100 pt-4 dark:border-zinc-800">
        New to Flipkart? <Link to="/register" className="text-primary-500 hover:underline">Create an account</Link>
      </div>
    </div>
  );
};

export default Login;
