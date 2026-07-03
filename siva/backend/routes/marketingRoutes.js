import express from 'express';
import {
  getCategories,
  createCategory,
  deleteCategory,
  getBrands,
  createBrand,
  deleteBrand,
  getBanners,
  getAllBannersAdmin,
  createBanner,
  deleteBanner,
} from '../controllers/marketingController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/categories', getCategories);
router.get('/brands', getBrands);
router.get('/banners', getBanners);

// Protected routes (Admin & Seller manage categories / brands)
router.post('/categories', protect, authorize('seller', 'admin'), createCategory);
router.delete('/categories/:id', protect, authorize('admin'), deleteCategory);

router.post('/brands', protect, authorize('seller', 'admin'), createBrand);
router.delete('/brands/:id', protect, authorize('admin'), deleteBrand);

// Admin-only banners management
router.get('/banners/admin', protect, authorize('admin'), getAllBannersAdmin);
router.post('/banners', protect, authorize('admin'), createBanner);
router.delete('/banners/:id', protect, authorize('admin'), deleteBanner);

export default router;
