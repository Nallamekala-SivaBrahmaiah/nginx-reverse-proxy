import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api.js';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState(1); // 1 = request, 2 = reset
  const [loading, setLoading] = useState(false);

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter email');

    setLoading(true);
    try {
      await API.post('/auth/forgot-password', { email });
      toast.success('Password reset OTP sent to email');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || !password) return toast.error('Please fill in all fields');

    setLoading(true);
    try {
      await API.post('/auth/reset-password', { email, otp, password });
      toast.success('Password reset successfully! Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-xl font-bold dark:text-white">
          {step === 1 ? 'Forgot Password?' : 'Reset Password'}
        </h3>
        <p className="text-xs text-gray-500 font-semibold">
          {step === 1
            ? 'Enter your registered email to receive a password verification code.'
            : 'Enter the verification OTP and configure your new secure password.'}
        </p>
      </div>

      {step === 1 ? (
        <form onSubmit={handleRequestOTP} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-sm focus:outline-none focus:border-primary-500 bg-transparent text-sm dark:border-zinc-800"
              placeholder="Enter Registered Email"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-secondary text-white font-bold rounded-sm text-sm hover:shadow-md transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Enter Verification OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              maxLength={6}
              className="w-full px-4 py-2 border border-gray-200 rounded-sm focus:outline-none focus:border-primary-500 bg-transparent text-sm dark:border-zinc-800 tracking-widest text-center font-bold text-lg"
              placeholder="000000"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Enter New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-200 rounded-sm focus:outline-none focus:border-primary-500 bg-transparent text-sm dark:border-zinc-800"
              placeholder="Choose a strong password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-secondary text-white font-bold rounded-sm text-sm hover:shadow-md transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;
