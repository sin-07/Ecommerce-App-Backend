import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { success } from '../utils/apiResponse.js';

const findOrCreateCart = async (userId) => {
  // Atomic upsert: one DB round-trip instead of find + conditionally create
  const cart = await Cart.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId, items: [] } },
    { upsert: true, new: true }
  ).populate('items.product');
  return cart;
};

export const getMyCart = async (req, res) => {
  const cart = await findOrCreateCart(req.user._id);
  return success(res, cart, 'Cart fetched');
};

export const addToCart = async (req, res) => {
  const { productId, quantity } = req.body;

  if (!productId || !quantity || Number(quantity) < 1) {
    return res.status(400).json({ success: false, message: 'productId and valid quantity are required' });
  }

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  if (product.stock < 10) {
    return res.status(400).json({ success: false, message: 'Product is out of stock' });
  }

  if (Number(quantity) < product.minOrderQuantity) {
    return res.status(400).json({
      success: false,
      message: `Minimum order quantity is ${product.minOrderQuantity}`
    });
  }

  const cart = await findOrCreateCart(req.user._id);

  const idx = cart.items.findIndex((item) => String(item.product._id || item.product) === productId);
  if (idx >= 0) {
    const nextQty = cart.items[idx].quantity + Number(quantity);
    if (nextQty > product.stock) {
      return res.status(400).json({ success: false, message: `Only ${product.stock} units available` });
    }
    cart.items[idx].quantity = nextQty;
  } else {
    if (Number(quantity) > product.stock) {
      return res.status(400).json({ success: false, message: `Only ${product.stock} units available` });
    }
    cart.items.push({ product: product._id, quantity: Number(quantity) });
  }

  await cart.save();
  const populated = await cart.populate('items.product');

  return success(res, populated, 'Item added to cart');
};

export const updateCartItem = async (req, res) => {
  const { productId, quantity } = req.body;
  if (!productId || !quantity || Number(quantity) < 1) {
    return res.status(400).json({ success: false, message: 'productId and valid quantity are required' });
  }

  const cart = await findOrCreateCart(req.user._id);
  const idx = cart.items.findIndex((item) => String(item.product._id || item.product) === productId);

  if (idx < 0) {
    return res.status(404).json({ success: false, message: 'Cart item not found' });
  }

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  if (product.stock < 10) {
    return res.status(400).json({ success: false, message: 'Product is out of stock' });
  }

  if (Number(quantity) > product.stock) {
    return res.status(400).json({ success: false, message: `Only ${product.stock} units available` });
  }

  if (Number(quantity) < product.minOrderQuantity) {
    return res.status(400).json({
      success: false,
      message: `Minimum order quantity is ${product.minOrderQuantity}`
    });
  }

  cart.items[idx].quantity = Number(quantity);
  await cart.save();

  const populated = await cart.populate('items.product');
  return success(res, populated, 'Cart updated');
};

export const removeCartItem = async (req, res) => {
  const { productId } = req.params;
  const cart = await findOrCreateCart(req.user._id);

  cart.items = cart.items.filter((item) => String(item.product._id || item.product) !== productId);
  await cart.save();

  const populated = await cart.populate('items.product');
  return success(res, populated, 'Item removed');
};

export const clearCart = async (req, res) => {
  const cart = await findOrCreateCart(req.user._id);
  cart.items = [];
  await cart.save();

  return success(res, cart, 'Cart cleared');
};
