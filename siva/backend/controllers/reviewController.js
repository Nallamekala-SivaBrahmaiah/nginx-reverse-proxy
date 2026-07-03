import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

export const getProductReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find({ product: req.params.productId })
    .populate('user', 'name avatar')
    .populate('replies.user', 'name role');

  // Calculate rating distribution
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalRating = 0;

  reviews.forEach((r) => {
    distribution[r.rating] = (distribution[r.rating] || 0) + 1;
    totalRating += r.rating;
  });

  const avgRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;

  res.status(200).json({
    status: 'success',
    reviews,
    stats: {
      avgRating: Number(avgRating),
      totalReviews: reviews.length,
      distribution,
    },
  });
});

export const createReview = catchAsync(async (req, res, next) => {
  const { product, rating, title, comment, images } = req.body;

  // Check if product exists
  const targetProduct = await Product.findById(product);
  if (!targetProduct) {
    return next(new AppError('Product not found', 404));
  }

  // Check if user already reviewed
  const existingReview = await Review.findOne({ user: req.user._id, product });
  if (existingReview) {
    return next(new AppError('You have already reviewed this product', 400));
  }

  // Check verified purchase (User ordered product and it's Shipped or Delivered)
  const orders = await Order.find({ user: req.user._id }).populate('orderItems');
  let isVerifiedPurchase = false;
  for (const ord of orders) {
    const hasProduct = ord.orderItems.some((item) => item.product.toString() === product);
    if (hasProduct) {
      isVerifiedPurchase = true;
      break;
    }
  }

  const review = await Review.create({
    user: req.user._id,
    product,
    rating: Number(rating),
    title,
    comment,
    images: images || [],
    isVerifiedPurchase,
  });

  // Re-calculate product rating and count
  const productReviews = await Review.find({ product });
  const totalRatings = productReviews.reduce((sum, r) => sum + r.rating, 0);
  targetProduct.ratings = totalRatings / productReviews.length;
  targetProduct.numOfReviews = productReviews.length;
  await targetProduct.save();

  res.status(201).json({
    status: 'success',
    review,
  });
});

export const likeReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  const userId = req.user._id;
  const isLiked = review.likes.includes(userId);

  if (isLiked) {
    review.likes = review.likes.filter((id) => id.toString() !== userId.toString());
  } else {
    review.likes.push(userId);
  }

  await review.save();

  res.status(200).json({
    status: 'success',
    likesCount: review.likes.length,
    isLiked: !isLiked,
  });
});

export const replyToReview = catchAsync(async (req, res, next) => {
  const { comment } = req.body;
  if (!comment) {
    return next(new AppError('Comment text is required', 400));
  }

  const review = await Review.findById(req.params.id);
  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  const productObj = await Product.findById(review.product);
  const isProductSeller = productObj && productObj.seller.toString() === req.user._id.toString();

  if (req.user.role !== 'admin' && !isProductSeller) {
    return next(new AppError('You are not authorized to reply to this review', 403));
  }

  review.replies.push({
    user: req.user._id,
    comment,
  });

  await review.save();
  await review.populate('replies.user', 'name role');

  res.status(200).json({
    status: 'success',
    review,
  });
});
