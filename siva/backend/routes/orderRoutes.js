import express from 'express';
import {
  createOrder,
  confirmPayment,
  getOrderDetails,
  getMyOrders,
  getSellerOrders,
  updateOrderItemStatus,
  updateOrderStatus,
  cancelOrder,
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All routes protected

router.route('/')
  .post(createOrder)
  .get(getMyOrders);

router.post('/confirm-payment', confirmPayment);

// Seller dashboard routes
router.get('/seller', authorize('seller', 'admin'), getSellerOrders);
router.put('/item/:id/status', authorize('seller', 'admin'), updateOrderItemStatus);

// Details and Cancellation
router.route('/:id')
  .get(getOrderDetails)
  .put(authorize('admin'), updateOrderStatus)
  .delete(cancelOrder);

export default router;
