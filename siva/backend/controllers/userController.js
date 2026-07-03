import User from '../models/User.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

export const getProfile = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({
    status: 'success',
    user,
  });
});

export const updateProfile = catchAsync(async (req, res, next) => {
  const { name, phone, avatar } = req.body;
  const user = await User.findById(req.user._id);

  user.name = name || user.name;
  user.phone = phone || user.phone;
  user.avatar = avatar || user.avatar;

  await user.save();

  res.status(200).json({
    status: 'success',
    user,
  });
});

// Admin operations
export const getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find({ role: 'customer' });
  res.status(200).json({
    status: 'success',
    users,
  });
});

export const getAllSellers = catchAsync(async (req, res, next) => {
  const sellers = await User.find({ role: 'seller' });
  res.status(200).json({
    status: 'success',
    sellers,
  });
});

export const updateUserStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  if (!['active', 'blocked'].includes(status)) {
    return next(new AppError('Invalid status', 400));
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  user.status = status;
  await user.save();

  res.status(200).json({
    status: 'success',
    message: `User status updated to ${status}`,
    user,
  });
});
