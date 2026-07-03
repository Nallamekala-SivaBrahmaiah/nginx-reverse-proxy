import express from 'express';
import {
  getProfile,
  updateProfile,
  getAllUsers,
  getAllSellers,
  updateUserStatus,
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All routes protected

router.route('/profile')
  .get(getProfile)
  .put(updateProfile);

// Admin operations
router.get('/admin/customers', authorize('admin'), getAllUsers);
router.get('/admin/sellers', authorize('admin'), getAllSellers);
router.put('/admin/status/:id', authorize('admin'), updateUserStatus);

export default router;
