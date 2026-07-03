import Wishlist from '../models/Wishlist.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

export const getWishlist = catchAsync(async (req, res, next) => {
  let wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
    path: 'products',
    populate: ['category', 'brand'],
  });

  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, products: [] });
  }

  res.status(200).json({
    status: 'success',
    wishlist,
  });
});

export const addToWishlist = catchAsync(async (req, res, next) => {
  const { productId } = req.body;

  if (!productId) {
    return next(new AppError('Product ID is required', 400));
  }

  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, products: [] });
  }

  if (wishlist.products.includes(productId)) {
    return res.status(200).json({
      status: 'success',
      message: 'Product already in wishlist',
      wishlist,
    });
  }

  wishlist.products.push(productId);
  await wishlist.save();
  await wishlist.populate({
    path: 'products',
    populate: ['category', 'brand'],
  });

  res.status(200).json({
    status: 'success',
    wishlist,
  });
});

export const removeFromWishlist = catchAsync(async (req, res, next) => {
  const { productId } = req.params;

  const wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) {
    return next(new AppError('Wishlist not found', 404));
  }

  wishlist.products = wishlist.products.filter((id) => id.toString() !== productId);
  await wishlist.save();
  await wishlist.populate({
    path: 'products',
    populate: ['category', 'brand'],
  });

  res.status(200).json({
    status: 'success',
    wishlist,
  });
});
