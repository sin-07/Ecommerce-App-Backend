import { Router } from 'express';
import {
  getAllOrders,
  getBuyAgainProducts,
  getBuyerOrders,
  getCustomerStats,
  getSellerOrders,
  placeOrder,
  updateOrderStatus
} from '../controllers/orderController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/', protect, restrictTo('buyer'), placeOrder);
router.get('/buyer', protect, restrictTo('buyer'), getBuyerOrders);
router.get('/buyer/buy-again', protect, restrictTo('buyer'), getBuyAgainProducts);
router.get('/buyer/stats', protect, restrictTo('buyer'), getCustomerStats);
router.get('/seller', protect, restrictTo('seller'), getSellerOrders);
router.get('/admin', protect, restrictTo('admin'), getAllOrders);
router.patch('/:id/status', protect, restrictTo('seller', 'admin'), updateOrderStatus);

export default router;
