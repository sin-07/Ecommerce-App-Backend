import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  getCategories,
  getProductById,
  getProducts,
  getSellerProducts,
  updateProduct
} from '../controllers/productController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { validate } from '../middleware/validateRequest.js';
import { validateCreateProduct, validateUpdateProduct } from '../validators/productValidators.js';

const router = Router();

router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/seller/me', protect, restrictTo('seller'), getSellerProducts);
router.get('/:id', getProductById);
router.post('/', protect, restrictTo('seller', 'admin'), upload.single('image'), validate(validateCreateProduct), createProduct);
router.put('/:id', protect, restrictTo('seller', 'admin'), upload.single('image'), validate(validateUpdateProduct), updateProduct);
router.delete('/:id', protect, restrictTo('seller', 'admin'), deleteProduct);

export default router;
