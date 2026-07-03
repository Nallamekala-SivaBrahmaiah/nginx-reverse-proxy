import express from 'express';
import {
  getAllCoupons,
  createCoupon,
  applyCoupon,
  deleteCoupon,
} from '../controllers/couponController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/apply', protect, applyCoupon);

// Admin-only / Seller routes
router.route('/')
  .get(protect, authorize('seller', 'admin'), getAllCoupons)
  .post(protect, authorize('seller', 'admin'), createCoupon);

router.route('/:id')
  .delete(protect, authorize('admin'), deleteCoupon);

export default router;
