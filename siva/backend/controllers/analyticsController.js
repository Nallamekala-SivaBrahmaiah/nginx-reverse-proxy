import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import Payment from '../models/Payment.js';
import catchAsync from '../utils/catchAsync.js';

export const getAdminAnalytics = catchAsync(async (req, res, next) => {
  const usersCount = await User.countDocuments({ role: 'customer' });
  const sellersCount = await User.countDocuments({ role: 'seller' });
  const productsCount = await Product.countDocuments({});
  const ordersCount = await Order.countDocuments({});

  // Calculate total revenue
  const revenueAggregate = await Order.aggregate([
    { $match: { 'paymentInfo.status': 'Paid' } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } },
  ]);
  const totalRevenue = revenueAggregate.length > 0 ? revenueAggregate[0].total : 0;

  // Monthly sales aggregate
  const monthlySales = await Order.aggregate([
    { $match: { 'paymentInfo.status': 'Paid' } },
    {
      $group: {
        _id: { $month: '$createdAt' },
        revenue: { $sum: '$totalPrice' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Map month numbers to strings
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedMonthlySales = monthlySales.map((item) => ({
    name: months[item._id - 1] || 'Month',
    Revenue: item.revenue,
    Orders: item.count,
  }));

  // Fetch recent orders
  const recentOrders = await Order.find({})
    .populate('user', 'name email')
    .sort('-createdAt')
    .limit(5);

  res.status(200).json({
    status: 'success',
    stats: {
      usersCount,
      sellersCount,
      productsCount,
      ordersCount,
      totalRevenue,
    },
    monthlySales: formattedMonthlySales,
    recentOrders,
  });
});

export const getSellerAnalytics = catchAsync(async (req, res, next) => {
  const sellerId = req.user._id;

  const productsCount = await Product.countDocuments({ seller: sellerId });

  // Calculate seller revenue and items sold
  const itemsAggregate = await OrderItem.aggregate([
    { $match: { seller: sellerId } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: { $multiply: ['$offerPrice', '$quantity'] } },
        totalItemsSold: { $sum: '$quantity' },
      },
    },
  ]);

  const totalRevenue = itemsAggregate.length > 0 ? itemsAggregate[0].totalRevenue : 0;
  const totalItemsSold = itemsAggregate.length > 0 ? itemsAggregate[0].totalItemsSold : 0;

  // Monthly sales specific to seller
  const monthlySales = await OrderItem.aggregate([
    { $match: { seller: sellerId } },
    {
      $group: {
        _id: { $month: '$createdAt' },
        revenue: { $sum: { $multiply: ['$offerPrice', '$quantity'] } },
        count: { $sum: '$quantity' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedMonthlySales = monthlySales.map((item) => ({
    name: months[item._id - 1] || 'Month',
    Revenue: item.revenue,
    Items: item.count,
  }));

  // Recent order items
  const recentItems = await OrderItem.find({ seller: sellerId })
    .populate('order')
    .populate('product', 'title images')
    .sort('-createdAt')
    .limit(5);

  res.status(200).json({
    status: 'success',
    stats: {
      productsCount,
      totalRevenue,
      totalItemsSold,
    },
    monthlySales: formattedMonthlySales,
    recentItems,
  });
});
