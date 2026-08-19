import { Router } from 'express';
import {
  addToCart,
  clearCart,
  getMyCart,
  removeCartItem,
  updateCartItem
} from '../controllers/cartController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect, restrictTo('buyer'));

router.get('/', getMyCart);
router.post('/items', addToCart);
router.put('/items', updateCartItem);
router.delete('/items/:productId', removeCartItem);
router.delete('/', clearCart);

export default router;
