import fs from 'fs';
import path from 'path';
import cloudinary from '../config/cloudinary.js';
import { env } from '../config/env.js';
import { Product } from '../models/Product.js';

const toBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  return String(value).toLowerCase() === 'true';
};

const parseTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map(String).map((t) => t.trim()).filter(Boolean);
  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
};

export const uploadImage = async (file) => {
  if (!file) return '';

  const hasCloudinaryKeys = Boolean(
    env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret
  );

  if (env.useCloudinary || hasCloudinaryKeys) {
    try {
      const result = await cloudinary.uploader.upload(file.path, { folder: 'b2b-products' });
      try {
        fs.unlinkSync(file.path);
      } catch {
        // safe cleanup
      }
      return result.secure_url;
    } catch (uploadError) {
      console.error('[Cloudinary Upload Error]:', uploadError.message);
      return `/uploads/${path.basename(file.path)}`;
    }
  }

  return `/uploads/${path.basename(file.path)}`;
};

export const createProduct = async ({ sellerId, file, payload }) => {
  let imageUrl = '';
  if (file) {
    imageUrl = await uploadImage(file);
  } else if (payload.imageUrl && typeof payload.imageUrl === 'string' && payload.imageUrl.trim()) {
    imageUrl = payload.imageUrl.trim();
  }

  return Product.create({
    name: String(payload.name || '').trim(),
    description: String(payload.description || '').trim(),
    category: String(payload.category || 'Beverages').trim(),
    price: Number(payload.price),
    discount: payload.discount == null || payload.discount === '' ? 0 : Number(payload.discount),
    stock: Number(payload.stock),
    minOrderQuantity: Number(payload.minOrderQuantity || 1),
    sku: String(payload.sku || '').trim(),
    unit: String(payload.unit || 'piece').trim(),
    packSize: String(payload.packSize || '').trim(),
    badge: String(payload.badge || '').trim(),
    tags: parseTags(payload.tags),
    isFeatured: toBoolean(payload.isFeatured, false),
    isBestSeller: toBoolean(payload.isBestSeller, false),
    isActive: toBoolean(payload.isActive, true),
    imageUrl,
    seller: sellerId
  });
};

export const getProducts = async ({
  page = 1,
  limit = 20,
  search,
  category,
  sellerId,
  minPrice,
  maxPrice,
  isFeatured,
  isBestSeller,
  sortBy = 'newest'
}) => {
  const safePage = Math.max(1, Number(page));
  const safeLimit = Math.min(100, Math.max(1, Number(limit)));
  const skip = (safePage - 1) * safeLimit;
  const query = { isActive: true };

  if (search && String(search).trim()) {
    const term = String(search).trim();
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [
      { name: regex },
      { description: regex },
      { category: regex },
      { sku: regex },
      { tags: regex },
      { packSize: regex }
    ];
  }

  if (category && String(category).trim() && String(category).toLowerCase() !== 'all') {
    query.category = { $regex: new RegExp(`^${String(category).trim()}$`, 'i') };
  }

  if (sellerId) {
    query.seller = sellerId;
  }

  if (isFeatured != null && isFeatured !== '') {
    query.isFeatured = toBoolean(isFeatured);
  }

  if (isBestSeller != null && isBestSeller !== '') {
    query.isBestSeller = toBoolean(isBestSeller);
  }

  if (minPrice != null || maxPrice != null) {
    query.price = {};
    if (minPrice != null && minPrice !== '') query.price.$gte = Number(minPrice);
    if (maxPrice != null && maxPrice !== '') query.price.$lte = Number(maxPrice);
  }

  let sortCriteria = { createdAt: -1 };
  if (sortBy === 'price_asc') sortCriteria = { price: 1 };
  else if (sortBy === 'price_desc') sortCriteria = { price: -1 };
  else if (sortBy === 'name_asc') sortCriteria = { name: 1 };
  else if (sortBy === 'popular') sortCriteria = { isBestSeller: -1, isFeatured: -1, createdAt: -1 };

  const [items, total] = await Promise.all([
    Product.find(query)
      .populate('seller', 'name companyName')
      .sort(sortCriteria)
      .skip(skip)
      .limit(safeLimit)
      .lean(),
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

export const getCategories = async () => {
  const categories = await Product.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  return categories.map((c) => ({
    name: c._id,
    count: c.count
  }));
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
  const textFields = ['name', 'description', 'category', 'sku', 'unit', 'packSize', 'badge'];
  textFields.forEach((field) => {
    if (payload[field] != null) update[field] = String(payload[field]).trim();
  });

  if (payload.tags != null) {
    update.tags = parseTags(payload.tags);
  }

  ['price', 'stock', 'minOrderQuantity', 'discount'].forEach((field) => {
    if (payload[field] != null && payload[field] !== '') update[field] = Number(payload[field]);
  });

  ['isActive', 'isFeatured', 'isBestSeller'].forEach((field) => {
    if (payload[field] != null && payload[field] !== '') {
      update[field] = toBoolean(payload[field], product[field]);
    }
  });

  if (file) {
    update.imageUrl = await uploadImage(file);
  } else if (payload.imageUrl && typeof payload.imageUrl === 'string' && payload.imageUrl.trim()) {
    update.imageUrl = payload.imageUrl.trim();
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
