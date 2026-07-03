import Cart from '../models/Cart.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

export const getCart = catchAsync(async (req, res, next) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  res.status(200).json({
    status: 'success',
    cart,
  });
});

export const addToCart = catchAsync(async (req, res, next) => {
  const { product, variantId, selectedSize, selectedColor, quantity = 1 } = req.body;

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  // Check if item already exists with the same variant
  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === product && item.variantId === variantId
  );

  if (itemIndex > -1) {
    cart.items[itemIndex].quantity += Number(quantity);
  } else {
    cart.items.push({
      product,
      variantId,
      selectedSize,
      selectedColor,
      quantity: Number(quantity),
    });
  }

  await cart.save();
  await cart.populate('items.product');

  res.status(200).json({
    status: 'success',
    cart,
  });
});

export const updateCartItem = catchAsync(async (req, res, next) => {
  const { variantId, quantity } = req.body;

  if (quantity < 1) {
    return next(new AppError('Quantity must be at least 1', 400));
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return next(new AppError('Cart not found', 404));
  }

  const itemIndex = cart.items.findIndex((item) => item.variantId === variantId);
  if (itemIndex === -1) {
    return next(new AppError('Item not found in cart', 404));
  }

  cart.items[itemIndex].quantity = Number(quantity);
  await cart.save();
  await cart.populate('items.product');

  res.status(200).json({
    status: 'success',
    cart,
  });
});

export const removeFromCart = catchAsync(async (req, res, next) => {
  const { variantId } = req.params;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return next(new AppError('Cart not found', 404));
  }

  cart.items = cart.items.filter((item) => item.variantId !== variantId);
  await cart.save();
  await cart.populate('items.product');

  res.status(200).json({
    status: 'success',
    cart,
  });
});

export const clearCart = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = [];
    await cart.save();
  }

  res.status(200).json({
    status: 'success',
    message: 'Cart cleared successfully',
  });
});
