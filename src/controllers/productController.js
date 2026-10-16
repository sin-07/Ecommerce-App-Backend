import { paginated, success } from '../utils/apiResponse.js';
import {
  createProduct as createProductService,
  deleteProduct as deleteProductService,
  getCategories as getCategoriesService,
  getFrequentlyBoughtTogether as getFrequentlyBoughtTogetherService,
  getPersonalizedRecommendations as getPersonalizedRecommendationsService,
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

  // Cache catalog listings on Vercel Edge CDN for 60s to shield MongoDB Free Tier
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=180');

  return paginated(
    res,
    items,
    pagination,
    'Products fetched'
  );
};

export const getCategories = async (req, res) => {
  const categories = await getCategoriesService();

  // Cache categories on Vercel Edge CDN for 5 minutes
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

  return success(res, categories, 'Categories fetched');
};

export const getProductById = async (req, res) => {
  const product = await getProductByIdService(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  // Cache individual product details on Edge CDN for 2 minutes
  res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');

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

export const getPersonalizedRecommendations = async (req, res) => {
  const data = await getPersonalizedRecommendationsService({ userId: req.user?._id });
  return success(res, data, 'Personalized recommendations fetched');
};

export const getFrequentlyBoughtTogether = async (req, res) => {
  const products = await getFrequentlyBoughtTogetherService(req.params.id);
  return success(res, products, 'Frequently bought together products fetched');
};
