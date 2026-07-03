import express from 'express';
import {
  getProductReviews,
  createReview,
  likeReview,
  replyToReview,
} from '../controllers/reviewController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/product/:productId', getProductReviews);

// Protected routes (Customer write, Like)
router.post('/', protect, createReview);
router.post('/:id/like', protect, likeReview);

// Admin/Seller reply routes
router.post('/:id/reply', protect, authorize('seller', 'admin'), replyToReview);

export default router;
