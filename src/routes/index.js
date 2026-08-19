import { Router } from 'express';
import adminRoutes from './adminRoutes.js';
import authRoutes from './authRoutes.js';
import cartRoutes from './cartRoutes.js';
import chatRoutes from './chatRoutes.js';
import orderRoutes from './orderRoutes.js';
import productRoutes from './productRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/chats', chatRoutes);
router.use('/admin', adminRoutes);

export default router;
