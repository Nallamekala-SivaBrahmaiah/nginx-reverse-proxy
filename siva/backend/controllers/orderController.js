import Stripe from 'stripe';
import Razorpay from 'razorpay';
import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import Payment from '../models/Payment.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

const isStripeConfigured = process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('placeholder');
const isRazorpayConfigured =
  process.env.RAZORPAY_KEY_ID &&
  process.env.RAZORPAY_KEY_SECRET &&
  !process.env.RAZORPAY_KEY_ID.includes('placeholder');

let stripe = null;
if (isStripeConfigured) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
}

let razorpay = null;
if (isRazorpayConfigured) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// Create new order with inventory verification & lock
export const createOrder = catchAsync(async (req, res, next) => {
  const { cartItems, shippingAddress, couponCode, paymentMethod } = req.body;

  if (!cartItems || cartItems.length === 0) {
    return next(new AppError('No items in the order', 400));
  }

  let itemsPrice = 0;
  const processedItems = [];

  // Verify stock & calculate prices
  for (const item of cartItems) {
    const product = await Product.findById(item.product);
    if (!product) {
      return next(new AppError(`Product ${item.product} not found`, 404));
    }

    // Find variant
    const variantIndex = product.variants.findIndex((v) => v._id.toString() === item.variantId);
    if (variantIndex === -1) {
      return next(new AppError(`Variant not found for product ${product.title}`, 404));
    }

    const variant = product.variants[variantIndex];
    if (variant.stock < item.quantity) {
      return next(new AppError(`Out of stock. Only ${variant.stock} units of ${product.title} available`, 400));
    }

    // Decrement stock
    product.variants[variantIndex].stock -= item.quantity;
    await product.save();

    itemsPrice += variant.offerPrice * item.quantity;

    processedItems.push({
      product: product._id,
      variantId: item.variantId,
      selectedSize: item.selectedSize || variant.size,
      selectedColor: item.selectedColor || variant.color,
      price: variant.price,
      offerPrice: variant.offerPrice,
      quantity: item.quantity,
      seller: product.seller,
    });
  }

  // Tax and Shipping Calculations
  const taxPrice = Number((itemsPrice * 0.18).toFixed(2)); // 18% standard tax
  const shippingPrice = itemsPrice < 500 ? 40 : 0; // Free shipping for orders above 500

  // Apply Coupon
  let discountPrice = 0;
  let couponApplied = null;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (coupon && coupon.isValid(itemsPrice)) {
      couponApplied = coupon._id;
      if (coupon.discountType === 'flat') {
        discountPrice = coupon.discountValue;
      } else if (coupon.discountType === 'percentage') {
        discountPrice = (coupon.discountValue / 100) * itemsPrice;
        if (coupon.maxDiscount > 0 && discountPrice > coupon.maxDiscount) {
          discountPrice = coupon.maxDiscount;
        }
      }
      coupon.usedCount += 1;
      await coupon.save();
    }
  }

  const totalPrice = Number((itemsPrice + taxPrice + shippingPrice - discountPrice).toFixed(2));

  // Initialize Order
  const order = await Order.create({
    user: req.user._id,
    shippingAddress,
    itemsPrice,
    taxPrice,
    shippingPrice,
    discountPrice,
    totalPrice,
    couponApplied,
    paymentInfo: {
      method: paymentMethod,
      status: paymentMethod === 'COD' ? 'Pending' : 'Pending',
    },
  });

  // Create OrderItems linked to Order
  const orderItemDocs = [];
  for (const pItem of processedItems) {
    const orderItem = await OrderItem.create({
      order: order._id,
      ...pItem,
    });
    orderItemDocs.push(orderItem._id);
  }

  order.orderItems = orderItemDocs;
  await order.save();

  // Payment gateways handling
  let gatewayPayload = {};

  if (paymentMethod === 'Stripe') {
    if (isStripeConfigured) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalPrice * 100), // stripe accepts in cents
        currency: 'inr',
        metadata: { orderId: order._id.toString() },
      });
      gatewayPayload = {
        clientSecret: paymentIntent.client_secret,
        transactionId: paymentIntent.id,
      };
    } else {
      // Simulate Stripe clientSecret
      gatewayPayload = {
        clientSecret: `mock_sec_${Math.random().toString(36).substr(2, 9)}`,
        transactionId: `mock_stripe_${Math.random().toString(36).substr(2, 9)}`,
      };
    }
  } else if (paymentMethod === 'Razorpay') {
    if (isRazorpayConfigured) {
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(totalPrice * 100), // razorpay accepts in paise
        currency: 'INR',
        receipt: order._id.toString(),
      });
      gatewayPayload = {
        razorpayOrderId: razorpayOrder.id,
        key: process.env.RAZORPAY_KEY_ID,
      };
    } else {
      // Simulate Razorpay orderId
      gatewayPayload = {
        razorpayOrderId: `order_mock_${Math.random().toString(36).substr(2, 9)}`,
        key: 'rzp_test_mock',
      };
    }
  }

  res.status(201).json({
    status: 'success',
    order,
    gatewayPayload,
  });
});

// Update payment status (Webhook / Frontend callback)
export const confirmPayment = catchAsync(async (req, res, next) => {
  const { orderId, transactionId, status } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  order.paymentInfo.id = transactionId;
  order.paymentInfo.status = status === 'succeeded' || status === 'Paid' ? 'Paid' : 'Failed';
  if (order.paymentInfo.status === 'Paid') {
    order.paidAt = new Date();
    order.status = 'Processing';
  }
  await order.save();

  // Create payment log
  await Payment.create({
    user: order.user,
    order: order._id,
    transactionId,
    amount: order.totalPrice,
    gateway: order.paymentInfo.method,
    status: order.paymentInfo.status === 'Paid' ? 'Succeeded' : 'Failed',
  });

  res.status(200).json({
    status: 'success',
    message: 'Payment status updated successfully',
    order,
  });
});

// Get single order details
export const getOrderDetails = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .populate({
      path: 'orderItems',
      populate: {
        path: 'product',
        select: 'title images category brand',
      },
    });

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  res.status(200).json({
    status: 'success',
    order,
  });
});

// Customer: Get my orders
export const getMyOrders = catchAsync(async (req, res, next) => {
  const orders = await Order.find({ user: req.user._id })
    .populate({
      path: 'orderItems',
      populate: {
        path: 'product',
        select: 'title images',
      },
    })
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    orders,
  });
});

// Seller: Get orders for items belonging to seller
export const getSellerOrders = catchAsync(async (req, res, next) => {
  // Find all order items matching this seller
  const items = await OrderItem.find({ seller: req.user._id })
    .populate('order')
    .populate('product', 'title images')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    items,
  });
});

// Seller/Admin: Update specific order item status (Pending, Shipped, Delivered, Cancelled)
export const updateOrderItemStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  const orderItem = await OrderItem.findById(req.params.id).populate('order');
  if (!orderItem) {
    return next(new AppError('OrderItem not found', 404));
  }

  // Check authorization
  if (req.user.role === 'seller' && orderItem.seller.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized to update this item', 403));
  }

  orderItem.status = status;
  await orderItem.save();

  // If all orderItems under the Order are Delivered/Cancelled, update the master Order status
  const order = await Order.findById(orderItem.order._id).populate('orderItems');
  const allStatuses = order.orderItems.map((item) => item.status);

  if (allStatuses.every((s) => s === 'Delivered')) {
    order.status = 'Delivered';
    order.deliveredAt = new Date();
    await order.save();
  } else if (allStatuses.every((s) => s === 'Cancelled')) {
    order.status = 'Cancelled';
    await order.save();
  } else if (allStatuses.some((s) => s === 'Shipped')) {
    order.status = 'Shipped';
    await order.save();
  }

  res.status(200).json({
    status: 'success',
    message: 'Order item status updated successfully',
    orderItem,
  });
});

// Admin: Update entire order status
export const updateOrderStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  order.status = status;
  if (status === 'Delivered') {
    order.deliveredAt = new Date();
  }
  await order.save();

  // Update all sub-items
  await OrderItem.updateMany({ order: order._id }, { status });

  res.status(200).json({
    status: 'success',
    order,
  });
});

// Cancel order and trigger refund
export const cancelOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate('orderItems');
  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Check authorization (customer who made the order, or admin)
  if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
    return next(new AppError('You are not authorized to cancel this order', 403));
  }

  if (order.status === 'Delivered') {
    return next(new AppError('Cannot cancel a delivered order', 400));
  }

  if (order.status === 'Cancelled') {
    return next(new AppError('Order is already cancelled', 400));
  }

  // Increment product stocks back
  for (const item of order.orderItems) {
    const product = await Product.findById(item.product);
    if (product) {
      const vIdx = product.variants.findIndex((v) => v._id.toString() === item.variantId);
      if (vIdx > -1) {
        product.variants[vIdx].stock += item.quantity;
        await product.save();
      }
    }
    item.status = 'Cancelled';
    await item.save();
  }

  order.status = 'Cancelled';

  // Handle mock / actual refund if already paid
  if (order.paymentInfo.status === 'Paid') {
    order.paymentInfo.status = 'Refunded';

    // Log refund
    await Payment.findOneAndUpdate(
      { order: order._id },
      {
        status: 'Refunded',
        refundDetails: {
          refundId: `ref_${Math.random().toString(36).substr(2, 9)}`,
          amountRefunded: order.totalPrice,
          reason: 'Customer Cancellation',
          refundedAt: new Date(),
        },
      }
    );
  }

  await order.save();

  res.status(200).json({
    status: 'success',
    message: 'Order cancelled successfully',
    order,
  });
});
