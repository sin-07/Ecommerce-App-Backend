import { paginated, success } from '../utils/apiResponse.js';
import {
  createProduct as createProductService,
  deleteProduct as deleteProductService,
  getProductById as getProductByIdService,
  getProducts as getProductsService,
  getSellerProducts as getSellerProductsService,
  updateProduct as updateProductService
} from '../services/productService.js';

export const createProduct = async (req, res) => {
  const product = await createProductService({ sellerId: req.user._id, file: req.file, payload: req.body });

  return success(res, product, 'Product created', 201);
};

export const getProducts = async (req, res) => {
  const { items, pagination } = await getProductsService(req.query);

  return paginated(
    res,
    items,
    pagination,
    'Products fetched'
  );
};

export const getProductById = async (req, res) => {
  const product = await getProductByIdService(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  return success(res, product);
};

export const updateProduct = async (req, res) => {
  const updated = await updateProductService({
    id: req.params.id,
    sellerId: req.user._id,
    role: req.user.role,
    payload: req.body,
    file: req.file
  });

  if (!updated) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  return success(res, updated, 'Product updated');
};

export const deleteProduct = async (req, res) => {
  const deleted = await deleteProductService({ id: req.params.id, sellerId: req.user._id, role: req.user.role });

  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  return success(res, null, 'Product deleted');
};

export const getSellerProducts = async (req, res) => {
  const products = await getSellerProductsService(req.user._id);
  return success(res, products, 'Seller products fetched');
};
