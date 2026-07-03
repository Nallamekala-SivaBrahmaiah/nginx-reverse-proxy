import Coupon from '../models/Coupon.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

export const getAllCoupons = catchAsync(async (req, res, next) => {
  const coupons = await Coupon.find({});
  res.status(200).json({
    status: 'success',
    coupons,
  });
});

export const createCoupon = catchAsync(async (req, res, next) => {
  const { code, discountType, discountValue, maxDiscount, minOrderValue, expiryDate, usageLimit } = req.body;

  const existing = await Coupon.findOne({ code });
  if (existing) {
    return next(new AppError('Coupon code already exists', 400));
  }

  const coupon = await Coupon.create({
    code,
    discountType,
    discountValue: Number(discountValue),
    maxDiscount: maxDiscount ? Number(maxDiscount) : 0,
    minOrderValue: minOrderValue ? Number(minOrderValue) : 0,
    expiryDate: new Date(expiryDate),
    usageLimit: usageLimit ? Number(usageLimit) : null,
  });

  res.status(201).json({
    status: 'success',
    coupon,
  });
});

export const applyCoupon = catchAsync(async (req, res, next) => {
  const { code, amount } = req.body;

  if (!code || !amount) {
    return next(new AppError('Coupon code and order amount are required', 400));
  }

  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (!coupon) {
    return next(new AppError('Invalid coupon code', 404));
  }

  if (!coupon.isValid(Number(amount))) {
    return next(new AppError('Coupon is expired, inactive, or terms not met', 400));
  }

  // Calculate discount
  let discount = 0;
  if (coupon.discountType === 'flat') {
    discount = coupon.discountValue;
  } else if (coupon.discountType === 'percentage') {
    discount = (coupon.discountValue / 100) * Number(amount);
    if (coupon.maxDiscount > 0 && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  }

  res.status(200).json({
    status: 'success',
    message: 'Coupon applied successfully!',
    couponId: coupon._id,
    code: coupon.code,
    discount,
  });
});

export const deleteCoupon = catchAsync(async (req, res, next) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    return next(new AppError('Coupon not found', 404));
  }

  await coupon.deleteOne();

  res.status(200).json({
    status: 'success',
    message: 'Coupon deleted successfully',
  });
});
