import mongoose from 'mongoose';
import { Cart } from '../models/Cart.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { sendPushToUsers } from '../services/pushNotificationService.js';
import { sendOrderEmailNotification } from '../services/emailService.js';
import { success } from '../utils/apiResponse.js';

const round2 = (value) => Math.round(Number(value || 0) * 100) / 100;

const getTieredUnitPrice = (product, quantity) => {
  const moq = Math.max(1, product.minOrderQuantity || 1);
  const base = Number(product.price || 0);
  const secondQty = Math.max(moq + 5, moq * 5);
  const thirdQty = Math.max(moq + 10, moq * 10);

  if (quantity >= thirdQty) return round2(base * 0.9);
  if (quantity >= secondQty) return round2(base * 0.95);
  return round2(base);
};

const mapCartToOrderItems = async (cartItems) => {
  const products = await Promise.all(
    cartItems.map((item) => Product.findById(item.product._id || item.product))
  );

  return cartItems.map((item, i) => {
    const product = products[i];
    if (!product || !product.isActive) {
      throw new Error('Invalid or inactive product in cart');
    }

    if (product.stock < 1) {
      throw new Error(`${product.name} is currently out of stock`);
    }

    if (product.stock < item.quantity) {
      throw new Error(`Insufficient warehouse stock for ${product.name} (only ${product.stock} available)`);
    }

    const moq = Math.max(1, product.minOrderQuantity || 1);
    if (item.quantity < moq) {
      throw new Error(`Minimum order quantity for ${product.name} is ${moq} ${product.unit || 'unit'}(s)`);
    }

    const unitPrice = getTieredUnitPrice(product, item.quantity);
    const lineTotal = round2(unitPrice * item.quantity);

    return {
      product: product._id,
      seller: product.seller,
      name: product.name,
      imageUrl: product.imageUrl || '',
      category: product.category || 'General',
      unit: product.unit || 'piece',
      packSize: product.packSize || '',
      quantity: item.quantity,
      unitPrice,
      subtotal: lineTotal,
      lineTotal
    };
  });
};

export const placeOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { customerName, phoneNumber, shippingAddress, deliveryAddressDetails, notes } = req.body;
    if (!customerName || !phoneNumber || !shippingAddress) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'customerName, phoneNumber and shippingAddress are required' });
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product').session(session);
    if (!cart || cart.items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const orderItems = await mapCartToOrderItems(cart.items);
    const subtotal = round2(orderItems.reduce((sum, item) => sum + item.lineTotal, 0));
    const deliveryFee = Number(req.body.deliveryFee || 0);
    const discount = Number(req.body.discount || 0);
    const totalAmount = round2(subtotal + deliveryFee - discount);

    const [order] = await Order.create(
      [
        {
          buyer: req.user._id,
          items: orderItems,
          subtotal,
          deliveryFee,
          discount,
          totalAmount,
          customerName: customerName.trim(),
          phoneNumber: phoneNumber.trim(),
          shippingAddress: shippingAddress.trim(),
          deliveryAddressDetails: deliveryAddressDetails || {
            fullName: customerName.trim(),
            phone: phoneNumber.trim(),
            street: shippingAddress.trim(),
            city: '',
            state: '',
            postalCode: '',
            country: 'India'
          },
          notes: notes || ''
        }
      ],
      { session }
    );

    cart.items = [];
    await cart.save({ session });

    await session.commitTransaction();
    const sellerIds = [...new Set(orderItems.map((item) => String(item.seller)).filter(Boolean))];

    // Async push notifications
    sendPushToUsers(
      [String(req.user._id), ...sellerIds],
      'Order placed',
      `Order #${String(order._id).slice(-6).toUpperCase()} has been placed successfully.`,
      { orderId: String(order._id), status: order.status }
    ).catch((err) => console.error('[Push Error]', err.message));

    // Async transactional order placed email to buyer
    sendOrderEmailNotification({
      recipientEmail: req.user.email,
      customerName: order.customerName || req.user.name,
      order,
      status: 'pending'
    }).catch((err) => console.error('[Order Email Error]', err.message));

    return success(res, order, 'Order placed', 201);
  } catch (error) {
    await session.abortTransaction();
    return res.status(400).json({ success: false, message: error.message || 'Failed to place order' });
  } finally {
    session.endSession();
  }
};

export const getBuyerOrders = async (req, res) => {
  const orders = await Order.find({ buyer: req.user._id })
    .populate('items.product', 'imageUrl category unit packSize name price')
    .sort({ createdAt: -1 })
    .lean();
  return success(res, orders, 'Order history fetched');
};

export const getSellerOrders = async (req, res) => {
  const orders = await Order.find({ 'items.seller': req.user._id })
    .populate('buyer', 'name email phone companyName')
    .populate('items.product', 'imageUrl category unit packSize name price')
    .sort({ createdAt: -1 })
    .lean();
  return success(res, orders, 'Seller orders fetched');
};

export const getAllOrders = async (_req, res) => {
  const orders = await Order.find({})
    .populate('buyer', 'name email phone companyName')
    .populate('items.product', 'imageUrl category unit packSize name price')
    .sort({ createdAt: -1 })
    .lean();
  return success(res, orders, 'All orders fetched');
};

export const updateOrderStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const { status } = req.body;
  if (!status) {
    await session.abortTransaction();
    session.endSession();
    return res.status(400).json({ success: false, message: 'status is required' });
  }

  try {
    const order = await Order.findById(req.params.id)
      .populate('buyer', 'name email')
      .populate('items.product', 'imageUrl category unit packSize name price')
      .session(session);
    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const allowedStatuses = ['pending', 'packed', 'shipped', 'delivered', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    if (req.user.role === 'seller') {
      const hasSellerItems = order.items.some((item) => String(item.seller) === String(req.user._id));
      if (!hasSellerItems) {
        await session.abortTransaction();
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
    }

    const statusChanged = order.status !== status;
    const shouldDeductStock = status === 'packed' && order.status !== 'packed';

    if (shouldDeductStock) {
      const products = await Promise.all(
        order.items.map((item) => Product.findById(item.product).session(session))
      );

      for (let i = 0; i < order.items.length; i++) {
        const item = order.items[i];
        const product = products[i];
        if (!product || !product.isActive) {
          throw new Error('Invalid product in order');
        }

        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }

        product.stock -= item.quantity;
        await product.save({ session });
      }
    }

    order.status = status;
    await order.save({ session });

    await session.commitTransaction();

    // Trigger push & email notifications if status actually changed
    if (statusChanged) {
      const statusTitle = `Order ${status.toUpperCase()}`;
      sendPushToUsers(
        [String(order.buyer?._id || order.buyer)],
        statusTitle,
        `Order #${String(order._id).slice(-6).toUpperCase()} is now ${status}.`,
        { orderId: String(order._id), status }
      ).catch((err) => console.error('[Push Error]', err.message));

      const buyerEmail = order.buyer?.email || (typeof order.buyer === 'string' ? (await User.findById(order.buyer))?.email : null);
      const buyerName = order.buyer?.name || order.customerName;

      if (buyerEmail) {
        sendOrderEmailNotification({
          recipientEmail: buyerEmail,
          customerName: buyerName,
          order,
          status
        }).catch((err) => console.error('[Order Status Email Error]', err.message));
      }
    }

    return success(res, order, 'Order status updated');
  } catch (error) {
    await session.abortTransaction();
    return res.status(400).json({ success: false, message: error.message || 'Failed to update order status' });
  } finally {
    session.endSession();
  }
};
