import { Router } from 'express';
import {
  dashboard,
  getAdminProducts,
  getUsers,
  removeUser,
  updateUserStatus
} from '../controllers/adminController.js';
import { createProduct, deleteProduct, updateProduct } from '../controllers/productController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { validate } from '../middleware/validateRequest.js';
import { validateCreateProduct, validateUpdateProduct } from '../validators/productValidators.js';

const router = Router();

router.use(protect, restrictTo('admin'));

router.get('/dashboard', dashboard);
router.get('/users', getUsers);
router.patch('/users/:id/status', updateUserStatus);
router.delete('/users/:id', removeUser);
router.get('/products', getAdminProducts);
router.post('/products', upload.single('image'), validate(validateCreateProduct), createProduct);
router.put('/products/:id', upload.single('image'), validate(validateUpdateProduct), updateProduct);
router.delete('/products/:id', deleteProduct);

export default router;
