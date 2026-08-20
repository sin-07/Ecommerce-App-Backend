import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);

export default router;
