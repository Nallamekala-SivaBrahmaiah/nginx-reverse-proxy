import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../services/api.js';
import toast from 'react-hot-toast';

const Register = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('customer');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !phone) {
      return toast.error('Please enter all fields');
    }

    setLoading(true);
    try {
      await API.post('/auth/register', { name, email, password, phone, role });
      toast.success('Registration successful! Please check your email for the verification OTP.');
      navigate(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-200 rounded-sm focus:outline-none focus:border-primary-500 bg-transparent text-sm dark:border-zinc-800"
            placeholder="Enter Full Name"
          />
        </div>
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
          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-200 rounded-sm focus:outline-none focus:border-primary-500 bg-transparent text-sm dark:border-zinc-800"
            placeholder="Enter Phone Number"
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

        <div>
          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Join As</label>
          <div className="flex gap-4 mt-1">
            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
              <input
                type="radio"
                name="role"
                value="customer"
                checked={role === 'customer'}
                onChange={() => setRole('customer')}
                className="text-primary-500 focus:ring-primary-500"
              />
              Customer
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
              <input
                type="radio"
                name="role"
                value="seller"
                checked={role === 'seller'}
                onChange={() => setRole('seller')}
                className="text-primary-500 focus:ring-primary-500"
              />
              Seller (Merchant)
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-secondary text-white font-bold rounded-sm text-sm hover:shadow-md transition duration-200 disabled:opacity-50"
        >
          {loading ? 'Creating Account...' : 'Continue'}
        </button>
      </form>

      <div className="text-center text-xs font-semibold text-gray-500 border-t border-gray-100 pt-4 dark:border-zinc-800">
        Existing User? <Link to="/login" className="text-primary-500 hover:underline">Log in</Link>
      </div>
    </div>
  );
};

export default Register;
