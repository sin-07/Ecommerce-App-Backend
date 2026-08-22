import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { success } from '../utils/apiResponse.js';

const cartPopulateOptions = {
  path: 'items.product',
  select: 'name price discount stock minOrderQuantity sku unit packSize badge imageUrl category isActive pricingTiers'
};

const getRawCart = async (userId) => {
  return await Cart.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId, items: [] } },
    { upsert: true, new: true }
  );
};

export const getMyCart = async (req, res) => {
  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    { $setOnInsert: { user: req.user._id, items: [] } },
    { upsert: true, new: true }
  ).populate(cartPopulateOptions);

  if (cart && Array.isArray(cart.items) && cart.items.some((item) => !item.product)) {
    const validItems = cart.items
      .filter((item) => Boolean(item.product))
      .map((item) => ({ product: item.product._id, quantity: item.quantity }));
    await Cart.updateOne({ _id: cart._id }, { $set: { items: validItems } });
    cart.items = cart.items.filter((item) => Boolean(item.product));
  }

  return success(res, cart, 'Cart fetched');
};

export const addToCart = async (req, res) => {
  const { productId, quantity } = req.body;

  if (!productId || !quantity || Number(quantity) < 1) {
    return res.status(400).json({ success: false, message: 'productId and valid quantity are required' });
  }

  const product = await Product.findById(productId);
  if (!product || !product.isActive || product.availabilityStatus === 'unavailable') {
    return res.status(400).json({ success: false, message: 'Product is currently unavailable' });
  }

  if (product.availabilityStatus === 'out_of_stock' || product.stock < 1) {
    return res.status(400).json({ success: false, message: 'Product is currently out of stock' });
  }

  if (Number(quantity) < product.minOrderQuantity) {
    return res.status(400).json({
      success: false,
      message: `Minimum order quantity is ${product.minOrderQuantity}`
    });
  }

  const cart = await getRawCart(req.user._id);

  const idx = cart.items.findIndex((item) => String(item.product?._id || item.product) === String(productId));
  if (idx >= 0) {
    const nextQty = cart.items[idx].quantity + Number(quantity);
    if (nextQty > product.stock) {
      return res.status(400).json({ success: false, message: `Only ${product.stock} units available` });
    }
    cart.items[idx].quantity = nextQty;
    // ensure product is stored as ObjectId
    cart.items[idx].product = product._id;
  } else {
    if (Number(quantity) > product.stock) {
      return res.status(400).json({ success: false, message: `Only ${product.stock} units available` });
    }
    cart.items.push({ product: product._id, quantity: Number(quantity) });
  }

  await cart.save();
  const populated = await cart.populate(cartPopulateOptions);

  return success(res, populated, 'Item added to cart');
};

export const updateCartItem = async (req, res) => {
  const { productId, quantity } = req.body;
  if (!productId || !quantity || Number(quantity) < 1) {
    return res.status(400).json({ success: false, message: 'productId and valid quantity are required' });
  }

  const cart = await getRawCart(req.user._id);
  const idx = cart.items.findIndex((item) => String(item.product?._id || item.product) === String(productId));

  if (idx < 0) {
    return res.status(404).json({ success: false, message: 'Cart item not found' });
  }

  const product = await Product.findById(productId);
  if (!product || !product.isActive || product.availabilityStatus === 'unavailable') {
    return res.status(400).json({ success: false, message: 'Product is currently unavailable' });
  }

  if (product.availabilityStatus === 'out_of_stock' || product.stock < 1) {
    return res.status(400).json({ success: false, message: 'Product is currently out of stock' });
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
  cart.items[idx].product = product._id;
  await cart.save();

  const populated = await cart.populate(cartPopulateOptions);
  return success(res, populated, 'Cart updated');
};

export const removeCartItem = async (req, res) => {
  const { productId } = req.params;
  const cart = await getRawCart(req.user._id);

  cart.items = cart.items.filter((item) => String(item.product?._id || item.product) !== String(productId));
  await cart.save();

  const populated = await cart.populate(cartPopulateOptions);
  return success(res, populated, 'Item removed');
};

export const clearCart = async (req, res) => {
  const cart = await getRawCart(req.user._id);
  cart.items = [];
  await cart.save();

  return success(res, cart, 'Cart cleared');
};
