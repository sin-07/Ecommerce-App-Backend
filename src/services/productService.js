import fs from 'fs';
import path from 'path';
import cloudinary from '../config/cloudinary.js';
import { env } from '../config/env.js';
import { Product } from '../models/Product.js';

const round2 = (value) => Math.round(value * 100) / 100;

const toBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  return String(value).toLowerCase() === 'true';
};

export const uploadImage = async (file) => {
  if (!file) return '';

  if (env.useCloudinary) {
    const result = await cloudinary.uploader.upload(file.path, { folder: 'b2b-products' });
    fs.unlinkSync(file.path);
    return result.secure_url;
  }

  return `/uploads/${path.basename(file.path)}`;
};

export const createProduct = async ({ sellerId, file, payload }) => {
  const imageUrl = await uploadImage(file);

  return Product.create({
    name: payload.name,
    description: payload.description,
    category: payload.category,
    price: Number(payload.price),
    discount: payload.discount == null || payload.discount === '' ? 0 : Number(payload.discount),
    stock: Number(payload.stock),
    minOrderQuantity: Number(payload.minOrderQuantity || 1),
    sku: String(payload.sku || '').trim(),
    isFeatured: toBoolean(payload.isFeatured),
    isActive: toBoolean(payload.isActive, true),
    imageUrl,
    seller: sellerId
  });
};

export const getProducts = async ({ page = 1, limit = 10, search, category, sellerId, minPrice, maxPrice }) => {
  const safePage = Math.max(1, Number(page));
  const safeLimit = Math.min(100, Math.max(1, Number(limit)));
  const skip = (safePage - 1) * safeLimit;
  const query = { isActive: true };

  if (search) {
    query.$text = { $search: search };
  }

  if (category) {
    query.category = category;
  }

  if (sellerId) {
    query.seller = sellerId;
  }

  if (minPrice != null || maxPrice != null) {
    query.price = {};
    if (minPrice != null) query.price.$gte = Number(minPrice);
    if (maxPrice != null) query.price.$lte = Number(maxPrice);
  }

  const [items, total] = await Promise.all([
    Product.find(query).populate('seller', 'name companyName').sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
    Product.countDocuments(query)
  ]);

  return {
    items,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit)
    }
  };
};

export const getProductById = async (id) => {
  return Product.findById(id).populate('seller', 'name companyName');
};

export const updateProduct = async ({ id, sellerId, role, payload, file }) => {
  const product = await Product.findById(id);
  if (!product) return null;

  if (String(product.seller) !== String(sellerId) && role !== 'admin') {
    const error = new Error('Forbidden');
    error.statusCode = 403;
    throw error;
  }

  const update = {};
  const textFields = ['name', 'description', 'category', 'sku'];
  textFields.forEach((field) => {
    if (payload[field] != null) update[field] = String(payload[field]).trim();
  });
  ['price', 'stock', 'minOrderQuantity', 'discount'].forEach((field) => {
    if (payload[field] != null && payload[field] !== '') update[field] = Number(payload[field]);
  });
  ['isActive', 'isFeatured'].forEach((field) => {
    if (payload[field] != null && payload[field] !== '') update[field] = toBoolean(payload[field], product[field]);
  });

  if (file) {
    update.imageUrl = await uploadImage(file);
  }

  return Product.findByIdAndUpdate(id, update, { new: true, runValidators: true });
};

export const deleteProduct = async ({ id, sellerId, role }) => {
  const product = await Product.findById(id);
  if (!product) return null;

  if (String(product.seller) !== String(sellerId) && role !== 'admin') {
    const error = new Error('Forbidden');
    error.statusCode = 403;
    throw error;
  }

  product.isActive = false;
  await product.save();
  return product;
};

export const getSellerProducts = async (sellerId) => {
  return Product.find({ seller: sellerId, isActive: true }).sort({ createdAt: -1 }).lean();
};
