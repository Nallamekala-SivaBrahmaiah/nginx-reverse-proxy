import User from '../models/User.js';
import OTP from '../models/Otp.js';
import RefreshToken from '../models/RefreshToken.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import sendEmail from '../services/mailService.js';
import { generateAccessToken, generateAndSetRefreshToken } from '../utils/tokenUtils.js';

export const register = catchAsync(async (req, res, next) => {
  const { name, email, password, phone, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('Email already registered', 400));
  }

  // Create User (unverified)
  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: role || 'customer',
  });

  // Generate OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
  await OTP.create({
    email,
    otp: otpCode,
    purpose: 'email_verification',
  });

  // Send Email
  await sendEmail({
    email,
    subject: 'Email Verification - Flipkart Clone',
    message: `Welcome to Flipkart Clone. Your verification OTP is: ${otpCode}. Valid for 5 minutes.`,
  });

  res.status(201).json({
    status: 'success',
    message: 'User registered successfully. Please verify your email using the OTP sent.',
    email,
  });
});

export const verifyEmail = catchAsync(async (req, res, next) => {
  const { email, otp } = req.body;

  const otpDoc = await OTP.findOne({ email, otp, purpose: 'email_verification' });
  if (!otpDoc) {
    return next(new AppError('Invalid or expired OTP', 400));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  user.isEmailVerified = true;
  await user.save();

  // Delete OTP document
  await otpDoc.deleteOne();

  res.status(200).json({
    status: 'success',
    message: 'Email verified successfully! You can now log in.',
  });
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  if (!user.isEmailVerified) {
    return next(new AppError('Please verify your email before logging in.', 401));
  }

  if (user.status === 'blocked') {
    return next(new AppError('Your account has been suspended.', 403));
  }

  // Token signatures
  const token = generateAccessToken(user);
  await generateAndSetRefreshToken(res, user);

  // Exclude password from response
  user.password = undefined;

  res.status(200).json({
    status: 'success',
    token,
    user,
  });
});

export const refreshToken = catchAsync(async (req, res, next) => {
  const tokenCookie = req.cookies.refreshToken;
  if (!tokenCookie) {
    return next(new AppError('Refresh token missing', 401));
  }

  const storedToken = await RefreshToken.findOne({ token: tokenCookie });
  if (!storedToken) {
    return next(new AppError('Invalid refresh token', 401));
  }

  const user = await User.findById(storedToken.user);
  if (!user) {
    return next(new AppError('User belonging to token not found', 401));
  }

  if (user.status === 'blocked') {
    return next(new AppError('User account suspended', 403));
  }

  // Rotate tokens
  const newAccessToken = generateAccessToken(user);
  await generateAndSetRefreshToken(res, user);

  // Delete old refresh token from DB
  await storedToken.deleteOne();

  res.status(200).json({
    status: 'success',
    token: newAccessToken,
  });
});

export const logout = catchAsync(async (req, res, next) => {
  const tokenCookie = req.cookies.refreshToken;
  if (tokenCookie) {
    await RefreshToken.deleteOne({ token: tokenCookie });
  }

  res.clearCookie('refreshToken');
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
});

export const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('User with this email does not exist.', 404));
  }

  // Delete old OTPs
  await OTP.deleteMany({ email, purpose: 'password_reset' });

  // Generate reset OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  await OTP.create({
    email,
    otp: otpCode,
    purpose: 'password_reset',
  });

  await sendEmail({
    email,
    subject: 'Password Reset - Flipkart Clone',
    message: `You requested a password reset. Your OTP is: ${otpCode}. Valid for 5 minutes.`,
  });

  res.status(200).json({
    status: 'success',
    message: 'Password reset OTP sent to email.',
    email,
  });
});

export const resetPassword = catchAsync(async (req, res, next) => {
  const { email, otp, password } = req.body;

  const otpDoc = await OTP.findOne({ email, otp, purpose: 'password_reset' });
  if (!otpDoc) {
    return next(new AppError('Invalid or expired OTP', 400));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  user.password = password;
  await user.save();

  // Delete OTP
  await otpDoc.deleteOne();

  res.status(200).json({
    status: 'success',
    message: 'Password reset successfully! You can now log in.',
  });
});
