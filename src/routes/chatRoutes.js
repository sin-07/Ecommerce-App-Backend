import { Router } from 'express';
import { getConversationByOrder, sendConversationMessage } from '../controllers/chatController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/order/:orderId', protect, restrictTo('buyer', 'seller', 'admin'), getConversationByOrder);
router.post('/order/:orderId/messages', protect, restrictTo('buyer', 'seller', 'admin'), sendConversationMessage);

export default router;
