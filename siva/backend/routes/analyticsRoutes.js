import express from 'express';
import {
  getAdminAnalytics,
  getSellerAnalytics,
} from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All routes protected

router.get('/admin', authorize('admin'), getAdminAnalytics);
router.get('/seller', authorize('seller', 'admin'), getSellerAnalytics);

export default router;
