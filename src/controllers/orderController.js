import mongoose from 'mongoose';
import { Cart } from '../models/Cart.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { createInAppNotification } from './notificationController.js';
import { sendPushToUsers } from '../services/pushNotificationService.js';
import { sendOrderEmailNotification, sendAdminNewOrderNotification } from '../services/emailService.js';
import { sendBuyerOrderWhatsApp, sendAdminNewOrderWhatsApp, sendOrderStatusUpdateWhatsApp } from '../services/whatsappService.js';
import { paginated, success } from '../utils/apiResponse.js';

const round2 = (value) => Math.round(Number(value || 0) * 100) / 100;

const getTieredUnitPrice = (product, quantity) => {
  if (product.pricingTiers && Array.isArray(product.pricingTiers) && product.pricingTiers.length > 0) {
    const matchedTier = product.pricingTiers.find((t) => {
      if (t.maxQty != null) {
        return quantity >= t.minQty && quantity <= t.maxQty;
      }
      return quantity >= t.minQty;
    });
    if (matchedTier && matchedTier.price > 0) {
      return round2(matchedTier.price);
    }
  }

  const moq = Math.max(1, product.minOrderQuantity || 1);
  const base = Number(product.price || 0);
  const secondQty = Math.max(moq + 5, moq * 5);
  const thirdQty = Math.max(moq + 10, moq * 10);

  if (quantity >= thirdQty) return round2(base * 0.9);
  if (quantity >= secondQty) return round2(base * 0.95);
  return round2(base);
};

const mapCartToOrderItems = async (cartItems, session = null) => {
  const productIds = cartItems.map((item) => item.product._id || item.product);
  const query = Product.find({ _id: { $in: productIds } });
  if (session) query.session(session);
  const products = await query.lean();
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  return cartItems.map((item) => {
    const pid = String(item.product._id || item.product);
    const product = productMap.get(pid);
    if (!product || !product.isActive || product.availabilityStatus === 'unavailable') {
      throw new Error(`Product "${product ? product.name : 'item'}" is currently unavailable for order`);
    }

    if (product.availabilityStatus === 'out_of_stock' || product.stock < 1) {
      throw new Error(`Product "${product.name}" is currently out of stock`);
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
  const idempotencyKey = req.body.idempotencyKey || req.headers['x-idempotency-key'] || null;

  // Duplicate submission protection
  if (idempotencyKey && typeof idempotencyKey === 'string' && idempotencyKey.trim()) {
    const cleanKey = idempotencyKey.trim();
    const existingOrder = await Order.findOne({ idempotencyKey: cleanKey })
      .populate('buyer', 'name email phone companyName')
      .populate('items.product', 'imageUrl category unit packSize name price')
      .lean();
    if (existingOrder) {
      return success(res, existingOrder, 'Order placed successfully', 200);
    }
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      customerName,
      phoneNumber,
      shippingAddress,
      deliveryAddress,
      deliveryAddressDetails,
      notes,
      amountPaid: rawAmountPaid
    } = req.body;

    const rawAddr = deliveryAddress || deliveryAddressDetails || {};
    const contactName = String(rawAddr.contactName || customerName || req.user.name || '').trim();
    const rawPhone = String(rawAddr.phone || phoneNumber || req.user.phone || '').trim();
    const addressLine1 = String(rawAddr.addressLine1 || rawAddr.street || shippingAddress || '').trim();
    const addressLine2 = String(rawAddr.addressLine2 || '').trim();
    const city = String(rawAddr.city || '').trim();
    const state = String(rawAddr.state || '').trim();
    const rawPincode = String(rawAddr.pincode || rawAddr.postalCode || '').trim();
    const country = String(rawAddr.country || 'India').trim();
    const orderNotes = String(rawAddr.notes || notes || '').trim();

    // Validations
    if (!contactName) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Contact Name is required' });
    }

    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Valid 10-digit phone number is required' });
    }

    if (!addressLine1) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Address Line 1 (House/Shop/Street) is required' });
    }

    if (!city) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'City is required' });
    }

    if (!state) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'State is required' });
    }

    const cleanPincode = rawPincode.replace(/[^0-9]/g, '');
    if (cleanPincode.length !== 6) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Valid 6-digit PIN code is required' });
    }

    const formattedShippingAddress = [
      addressLine1,
      addressLine2,
      `${city}, ${state} - ${cleanPincode}`,
      country !== 'India' ? country : ''
    ]
      .filter(Boolean)
      .join(', ');

    const structuredDeliveryAddress = {
      contactName,
      phone: cleanPhone,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode: cleanPincode,
      country,
      notes: orderNotes,
      fullName: contactName,
      street: addressLine1,
      postalCode: cleanPincode
    };

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product').session(session);
    if (!cart || cart.items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const orderItems = await mapCartToOrderItems(cart.items, session);
    const subtotal = round2(orderItems.reduce((sum, item) => sum + item.lineTotal, 0));
    const deliveryFee = Number(req.body.deliveryFee || 0);
    const discount = Number(req.body.discount || 0);
    const totalAmount = round2(subtotal + deliveryFee - discount);

    const amountPaid = Math.max(0, round2(Number(rawAmountPaid || 0)));
    const amountDue = Math.max(0, round2(totalAmount - amountPaid));
    const paymentStatus = amountPaid >= totalAmount ? 'PAID' : amountPaid > 0 ? 'PARTIALLY_PAID' : 'DUE';

    const orderPayload = {
      buyer: req.user._id,
      items: orderItems,
      subtotal,
      deliveryFee,
      discount,
      totalAmount,
      amountPaid,
      amountDue,
      paymentStatus,
      customerName: contactName,
      phoneNumber: cleanPhone,
      shippingAddress: formattedShippingAddress,
      deliveryAddress: structuredDeliveryAddress,
      deliveryAddressDetails: structuredDeliveryAddress,
      status: 'pending',
      notes: orderNotes
    };

    if (idempotencyKey && typeof idempotencyKey === 'string' && idempotencyKey.trim()) {
      orderPayload.idempotencyKey = idempotencyKey.trim();
    }

    const [order] = await Order.create([orderPayload], { session });

    cart.items = [];
    await cart.save({ session });

    await session.commitTransaction();
    const sellerIds = [...new Set(orderItems.map((item) => String(item.seller)).filter(Boolean))];

    // Async push notifications to buyer and sellers
    sendPushToUsers(
      [String(req.user._id), ...sellerIds],
      'Order placed',
      `Order #${String(order._id).slice(-6).toUpperCase()} has been placed successfully.`,
      { orderId: String(order._id), status: order.status }
    ).catch((err) => console.error('[Push Error]', err.message));

    // Async transactional order confirmation email to buyer
    if (req.user.email) {
      sendOrderEmailNotification({
        recipientEmail: req.user.email,
        customerName: order.customerName || req.user.name,
        order,
        status: 'pending'
      }).catch((err) => console.error('[Order Email Error]', err.message));
    }

    // Async transactional new order notification email to Admin
    sendAdminNewOrderNotification({
      order,
      buyer: req.user
    }).catch((err) => console.error('[Admin Order Email Error]', err.message));

    // Async WhatsApp notification to Buyer
    sendBuyerOrderWhatsApp(order).catch((err) => console.error('[Buyer WhatsApp Error]', err.message));

    // Async WhatsApp instant alert to Admin
    sendAdminNewOrderWhatsApp(order, req.user).catch((err) => console.error('[Admin WhatsApp Error]', err.message));

    // Create in-app notification for the customer
    createInAppNotification({
      recipient: req.user._id,
      title: 'Order Confirmed',
      message: `Your wholesale order #${String(order._id).slice(-6).toUpperCase()} for ₹${order.totalAmount} has been placed.`,
      type: 'order',
      metadata: { orderId: String(order._id), status: 'pending' }
    }).catch((err) => console.error('[InApp Notification Error]', err.message));

    return success(res, order, 'Order placed successfully', 201);
  } catch (error) {
    await session.abortTransaction();
    return res.status(400).json({ success: false, message: error.message || 'Failed to place order' });
  } finally {
    session.endSession();
  }
};

export const computeOrderTotals = (order) => {
  if (!order || !order.items) return order;
  const activeItems = (order.items || []).filter((it) => it.status !== 'cancelled');
  const activeSubtotal = activeItems.reduce(
    (sum, it) => sum + (it.lineTotal !== undefined ? Number(it.lineTotal) : Number(it.quantity * it.unitPrice) || 0),
    0
  );
  const deliveryFee = Number(order.deliveryFee) || 0;
  const discount = Number(order.discount) || 0;
  const newTotal = Math.max(0, activeSubtotal + deliveryFee - discount);
  const amountPaid = Number(order.amountPaid) || 0;
  const newAmountDue = Math.max(0, newTotal - amountPaid);

  order.subtotal = activeSubtotal;
  order.totalAmount = newTotal;
  order.amountDue = newAmountDue;
  if (newTotal === 0) {
    order.paymentStatus = 'PAID';
  } else if (amountPaid >= newTotal) {
    order.paymentStatus = 'PAID';
  } else if (amountPaid > 0) {
    order.paymentStatus = 'PARTIALLY_PAID';
  } else {
    order.paymentStatus = 'DUE';
  }
  return order;
};

export const getBuyerOrders = async (req, res) => {
  const page = req.query.page ? Math.max(1, Number(req.query.page)) : null;
  const limit = req.query.limit ? Math.min(50, Math.max(1, Number(req.query.limit))) : (page ? 20 : null);
  const status = req.query.status ? String(req.query.status).trim() : null;

  const query = { buyer: req.user._id };
  if (status && status !== 'all') {
    query.status = status;
  }

  if (page) {
    const skip = (page - 1) * limit;
    const [rawOrders, total] = await Promise.all([
      Order.find(query)
        .populate('items.product', 'imageUrl category unit packSize name price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query)
    ]);
    const orders = rawOrders.map(computeOrderTotals);
    return paginated(res, orders, { total, page, limit, totalPages: Math.ceil(total / limit) }, 'Order history fetched');
  }

  const rawOrders = await Order.find(query)
    .populate('items.product', 'imageUrl category unit packSize name price')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  const orders = rawOrders.map(computeOrderTotals);

  return success(res, orders, 'Order history fetched');
};

export const getSellerOrders = async (req, res) => {
  const page = req.query?.page ? Math.max(1, Number(req.query.page)) : null;
  const limit = req.query?.limit ? Math.min(50, Math.max(1, Number(req.query.limit))) : (page ? 20 : null);

  const query = { 'items.seller': req.user._id };

  if (page) {
    const skip = (page - 1) * limit;
    const [rawOrders, total] = await Promise.all([
      Order.find(query)
        .populate('buyer', 'name email phone companyName')
        .populate('items.product', 'imageUrl category unit packSize name price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query)
    ]);
    const orders = rawOrders.map(computeOrderTotals);
    return paginated(res, orders, { total, page, limit, totalPages: Math.ceil(total / limit) }, 'Seller orders fetched');
  }

  const rawOrders = await Order.find(query)
    .populate('buyer', 'name email phone companyName')
    .populate('items.product', 'imageUrl category unit packSize name price')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  const orders = rawOrders.map(computeOrderTotals);

  return success(res, orders, 'Seller orders fetched');
};

export const getAllOrders = async (req, res) => {
  const page = req.query?.page ? Math.max(1, Number(req.query.page)) : null;
  const limit = req.query?.limit ? Math.min(50, Math.max(1, Number(req.query.limit))) : (page ? 20 : null);
  const status = req.query?.status ? String(req.query.status).trim() : null;

  const query = {};
  if (status && status !== 'all') {
    query.status = status;
  }

  if (page) {
    const skip = (page - 1) * limit;
    const [rawOrders, total] = await Promise.all([
      Order.find(query)
        .populate('buyer', 'name email phone companyName')
        .populate('items.product', 'imageUrl category unit packSize name price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query)
    ]);
    const orders = rawOrders.map(computeOrderTotals);
    return paginated(res, orders, { total, page, limit, totalPages: Math.ceil(total / limit) }, 'All orders fetched');
  }

  const rawOrders = await Order.find(query)
    .populate('buyer', 'name email phone companyName')
    .populate('items.product', 'imageUrl category unit packSize name price')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  const orders = rawOrders.map(computeOrderTotals);

  return success(res, orders, 'All orders fetched');
};

export const updateOrderStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const { status, amountPaid, paymentStatus } = req.body;

  try {
    const order = await Order.findById(req.params.id)
      .populate('buyer', 'name email phone companyName')
      .populate('items.product', 'imageUrl category unit packSize name price')
      .session(session);
    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status === 'cancelled') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Cancelled orders cannot be modified.' });
    }

    if (status === 'cancelled') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Please use the Cancel Order feature with a cancellation reason note.' });
    }

    if (req.user.role === 'seller') {
      const hasSellerItems = order.items.some((item) => String(item.seller) === String(req.user._id));
      if (!hasSellerItems) {
        await session.abortTransaction();
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
    }

    let statusChanged = false;
    const targetStatus = status || order.status;

    if (targetStatus && targetStatus !== order.status) {
      if (order.status === 'delivered') {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: 'Delivered orders cannot be moved back to a previous stage.' });
      }

      const allowedStatuses = [
        'pending',
        'processing',
        'confirmed',
        'packed',
        'shipped',
        'dispatched',
        'delivered'
      ];
      if (!allowedStatuses.includes(targetStatus)) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: `Invalid status: ${targetStatus}` });
      }

      const shouldDeductStock = (targetStatus === 'packed' || targetStatus === 'confirmed') && order.status === 'pending';

      if (shouldDeductStock) {
        const activeItems = order.items.filter((item) => item.status !== 'cancelled');
        const productIds = activeItems.map((item) => item.product._id || item.product);
        const products = await Product.find({ _id: { $in: productIds } }).session(session);
        const productMap = new Map(products.map((p) => [String(p._id), p]));

        for (let i = 0; i < activeItems.length; i++) {
          const item = activeItems[i];
          const pid = String(item.product._id || item.product);
          const product = productMap.get(pid);
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

      order.status = targetStatus;
      statusChanged = true;

      if (targetStatus === 'delivered' && !order.deliveredAt) {
        order.deliveredAt = new Date();
      }
      if ((targetStatus === 'shipped' || targetStatus === 'dispatched') && !order.dispatchedAt) {
        order.dispatchedAt = new Date();
      }
    }

    // Ensure order subtotal and totalAmount are normalized based strictly on active items
    computeOrderTotals(order);
    const currentTotal = order.totalAmount;

    // Process Payment Updates
    const normPaymentStatus = String(paymentStatus || '').toUpperCase();
    const isPaymentUpdate = amountPaid !== undefined || ['DUE', 'PARTIALLY_PAID', 'PAID'].includes(normPaymentStatus);

    if (isPaymentUpdate) {
      if (order.status === 'delivered' || order.deliveredAt) {
        const deliveredTime = order.deliveredAt ? new Date(order.deliveredAt).getTime() : 0;
        const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
        if (deliveredTime > 0 && (Date.now() - deliveredTime > TWELVE_HOURS_MS)) {
          await session.abortTransaction();
          return res.status(400).json({
            success: false,
            message: 'Payment window expired. Payment can only be marked within 12 hours after delivery.'
          });
        }
      }
    }

    if (normPaymentStatus === 'PAID' || (amountPaid !== undefined && Number(amountPaid) >= currentTotal)) {
      order.amountPaid = currentTotal;
      order.amountDue = 0;
      order.paymentStatus = 'PAID';
    } else if (amountPaid !== undefined) {
      order.amountPaid = Math.max(0, round2(Number(amountPaid)));
      order.amountDue = Math.max(0, round2(currentTotal - order.amountPaid));
      order.paymentStatus = order.amountPaid >= currentTotal ? 'PAID' : order.amountPaid > 0 ? 'PARTIALLY_PAID' : 'DUE';
    } else if (['DUE', 'PARTIALLY_PAID', 'PAID'].includes(normPaymentStatus)) {
      order.paymentStatus = normPaymentStatus;
      if (normPaymentStatus === 'PAID') {
        order.amountPaid = currentTotal;
        order.amountDue = 0;
      }
    }

    await order.save({ session });
    await session.commitTransaction();

    // Trigger push & email notifications if status actually changed
    if (statusChanged) {
      const statusTitle = `Order ${order.status.toUpperCase()}`;
      sendPushToUsers(
        [String(order.buyer?._id || order.buyer)],
        statusTitle,
        `Order #${String(order._id).slice(-6).toUpperCase()} is now ${order.status}.`,
        { orderId: String(order._id), status: order.status }
      ).catch((err) => console.error('[Push Error]', err.message));

      const buyerEmail = order.buyer?.email || (typeof order.buyer === 'string' ? (await User.findById(order.buyer))?.email : null);
      const buyerName = order.buyer?.name || order.customerName;

      if (buyerEmail) {
        sendOrderEmailNotification({
          recipientEmail: buyerEmail,
          customerName: buyerName,
          order,
          status: order.status
        }).catch((err) => console.error('[Order Status Email Error]', err.message));
      }

      // Async WhatsApp notification on order status change
      sendOrderStatusUpdateWhatsApp(order, order.status).catch((err) => console.error('[Order Status WhatsApp Error]', err.message));

      // Create in-app notification for the buyer
      createInAppNotification({
        recipient: order.buyer?._id || order.buyer,
        title: `Order #${String(order._id).slice(-6).toUpperCase()} ${order.status.toUpperCase()}`,
        message: `Your wholesale order status is now ${order.status}.`,
        type: order.status === 'delivered' ? 'delivery' : 'order',
        metadata: { orderId: String(order._id), status: order.status }
      }).catch((err) => console.error('[InApp Notification Error]', err.message));
    }

    return success(res, computeOrderTotals(order), 'Order updated successfully');
  } catch (error) {
    await session.abortTransaction();
    return res.status(400).json({ success: false, message: error.message || 'Failed to update order' });
  } finally {
    session.endSession();
  }
};

export const getBuyAgainProducts = async (req, res) => {
  // Fetch real past non-cancelled orders placed by the current authenticated buyer
  const orders = await Order.find({
    buyer: req.user._id,
    status: { $ne: 'cancelled' }
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!orders || orders.length === 0) {
    return success(res, [], 'No previous purchase history');
  }

  // Collect distinct product IDs and their most recent ordered quantities
  const productMap = new Map(); // productId -> { previousQuantity, lastOrderedAt }
  for (const order of orders) {
    for (const item of order.items || []) {
      const pid = String(item.product?._id || item.product);
      if (pid && !productMap.has(pid)) {
        productMap.set(pid, {
          previousQuantity: item.quantity || 1,
          lastOrderedAt: order.createdAt
        });
      }
    }
  }

  const productIds = Array.from(productMap.keys());
  const liveProducts = await Product.find({
    _id: { $in: productIds },
    isActive: true
  }).lean();

  const buyAgainItems = liveProducts.map((prod) => {
    const meta = productMap.get(String(prod._id)) || { previousQuantity: 1, lastOrderedAt: prod.updatedAt };
    return {
      ...prod,
      previousQuantity: meta.previousQuantity,
      lastOrderedAt: meta.lastOrderedAt
    };
  });

  return success(res, buyAgainItems, 'Buy again products fetched');
};

export const getCustomerStats = async (req, res) => {
  const orders = await Order.find({ buyer: req.user._id }).lean();

  const totalOrders = orders.length;
  let inTransitOrders = 0;
  let completedOrders = 0;
  let totalSpend = 0;
  let totalPaid = 0;
  let totalDue = 0;

  for (const order of orders) {
    if (order.status !== 'cancelled') {
      totalSpend += Number(order.totalAmount || 0);
      totalPaid += Number(order.amountPaid || 0);
      totalDue += Number(order.amountDue !== undefined ? order.amountDue : Math.max(0, order.totalAmount - (order.amountPaid || 0)));
    }

    if (['pending', 'processing', 'confirmed', 'packed', 'shipped', 'dispatched'].includes(order.status)) {
      inTransitOrders++;
    } else if (order.status === 'delivered') {
      completedOrders++;
    }
  }

  return success(
    res,
    {
      totalOrders,
      inTransitOrders,
      completedOrders,
      totalSpend: round2(totalSpend),
      totalPaid: round2(totalPaid),
      totalDue: round2(totalDue)
    },
    'Customer stats fetched'
  );
};

export const cancelOrder = async (req, res) => {
  const { reason } = req.body;
  const cleanReason = String(reason || '').trim();

  if (!cleanReason) {
    return res.status(400).json({ success: false, message: 'Cancellation reason is required' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(req.params.id)
      .populate('buyer', 'name email phone companyName')
      .populate('items.product', 'name stock isActive')
      .session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status === 'cancelled') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Order is already cancelled' });
    }

    if (order.status === 'delivered') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Delivered orders cannot be cancelled' });
    }

    const hadDeductedStock = ['confirmed', 'packed', 'shipped', 'dispatched'].includes(order.status);

    if (hadDeductedStock) {
      for (const item of order.items) {
        if (item.status !== 'cancelled' && item.product) {
          await Product.findByIdAndUpdate(
            item.product._id || item.product,
            { $inc: { stock: item.quantity } },
            { session }
          );
        }
      }
    }

    const cancelDate = new Date();
    order.status = 'cancelled';
    order.cancellationReason = cleanReason;
    order.cancelledBy = req.user._id;
    order.cancelledAt = cancelDate;

    for (const item of order.items) {
      item.status = 'cancelled';
      if (!item.cancellationReason) {
        item.cancellationReason = cleanReason;
      }
      item.cancelledBy = item.cancelledBy || req.user._id;
      item.cancelledAt = item.cancelledAt || cancelDate;
    }

    await order.save({ session });
    await session.commitTransaction();

    const shortId = String(order._id).slice(-6).toUpperCase();
    const buyerId = String(order.buyer?._id || order.buyer);

    // Create In-App Notification for customer
    createInAppNotification({
      recipient: buyerId,
      title: 'Order Cancelled',
      message: `Your order #${shortId} has been cancelled by the admin. Reason: ${cleanReason}`,
      type: 'order',
      metadata: { orderId: String(order._id), status: 'cancelled', reason: cleanReason }
    }).catch((err) => console.error('[InApp Notification Error]', err.message));

    // Send Push Notification
    sendPushToUsers(
      [buyerId],
      'Order Cancelled',
      `Your order #${shortId} has been cancelled. Reason: ${cleanReason}`,
      { orderId: String(order._id), status: 'cancelled' }
    ).catch((err) => console.error('[Push Error]', err.message));

    return success(res, order, 'Order cancelled successfully');
  } catch (error) {
    await session.abortTransaction();
    return res.status(400).json({ success: false, message: error.message || 'Failed to cancel order' });
  } finally {
    session.endSession();
  }
};

export const cancelOrderItem = async (req, res) => {
  const { reason, itemIndex, itemId, productId } = req.body;
  const cleanReason = String(reason || '').trim();

  if (!cleanReason) {
    return res.status(400).json({ success: false, message: 'Cancellation reason is required' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(req.params.id)
      .populate('buyer', 'name email phone companyName')
      .populate('items.product', 'name stock isActive')
      .session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status === 'cancelled') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Order is already cancelled' });
    }

    if (order.status === 'delivered') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Delivered orders cannot have items cancelled' });
    }

    let targetIndex = -1;

    if (itemId) {
      targetIndex = order.items.findIndex((it) => String(it._id) === String(itemId));
    } else if (itemIndex !== undefined && Number(itemIndex) >= 0 && Number(itemIndex) < order.items.length) {
      targetIndex = Number(itemIndex);
    } else if (productId) {
      targetIndex = order.items.findIndex((it) => String(it.product?._id || it.product) === String(productId));
    }

    if (targetIndex < 0 || !order.items[targetIndex]) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Order item not found' });
    }

    const targetItem = order.items[targetIndex];

    if (targetItem.status === 'cancelled') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'This item is already cancelled' });
    }

    const hadDeductedStock = ['confirmed', 'packed', 'shipped', 'dispatched'].includes(order.status);
    if (hadDeductedStock && targetItem.product) {
      await Product.findByIdAndUpdate(
        targetItem.product._id || targetItem.product,
        { $inc: { stock: targetItem.quantity } },
        { session }
      );
    }

    const cancelDate = new Date();
    targetItem.status = 'cancelled';
    targetItem.cancellationReason = cleanReason;
    targetItem.cancelledBy = req.user._id;
    targetItem.cancelledAt = cancelDate;

    // Recalculate subtotal, totalAmount, and amountDue based strictly on NON-CANCELLED (active) items
    const activeItems = order.items.filter((it) => it.status !== 'cancelled');
    const newSubtotal = activeItems.reduce(
      (sum, it) => sum + (it.lineTotal !== undefined ? it.lineTotal : it.quantity * it.unitPrice || 0),
      0
    );
    const discount = Number(order.discount) || 0;
    const deliveryFee = Number(order.deliveryFee) || 0;
    const newTotal = Math.max(0, newSubtotal + deliveryFee - discount);
    const amountPaid = Number(order.amountPaid) || 0;
    const newAmountDue = Math.max(0, newTotal - amountPaid);

    order.subtotal = newSubtotal;
    order.totalAmount = newTotal;
    order.amountDue = newAmountDue;

    if (newTotal === 0) {
      order.paymentStatus = 'PAID';
    } else if (amountPaid >= newTotal) {
      order.paymentStatus = 'PAID';
    } else if (amountPaid > 0) {
      order.paymentStatus = 'PARTIALLY_PAID';
    } else {
      order.paymentStatus = 'DUE';
    }

    // Check if all items are now cancelled
    const allCancelled = order.items.every((it) => it.status === 'cancelled');
    if (allCancelled) {
      order.status = 'cancelled';
      order.cancellationReason = 'All items in order were cancelled.';
      order.cancelledBy = req.user._id;
      order.cancelledAt = cancelDate;
    }

    await order.save({ session });
    await session.commitTransaction();

    const shortId = String(order._id).slice(-6).toUpperCase();
    const buyerId = String(order.buyer?._id || order.buyer);
    const itemName = targetItem.name || 'Product';
    const cancelledItemAmount = targetItem.lineTotal !== undefined ? targetItem.lineTotal : targetItem.quantity * targetItem.unitPrice || 0;
    const formattedCancelledAmount = `₹${Number(cancelledItemAmount).toLocaleString('en-IN')}`;
    const formattedNewTotal = `₹${Number(newTotal).toLocaleString('en-IN')}`;

    const notifMessage = `${itemName} was cancelled because ${cleanReason}. ${formattedCancelledAmount} has been removed from your order total. Your revised order total is ${formattedNewTotal}.`;

    // Create in-app notification
    createInAppNotification({
      recipient: buyerId,
      title: 'Product Cancelled From Order',
      message: notifMessage,
      type: 'order',
      metadata: {
        orderId: String(order._id),
        itemId: String(targetItem._id || ''),
        cancelledAmount: cancelledItemAmount,
        revisedTotal: newTotal,
        reason: cleanReason
      }
    }).catch((err) => console.error('[InApp Notification Error]', err.message));

    // Send push notification
    sendPushToUsers(
      [buyerId],
      'Product Cancelled From Order',
      notifMessage,
      { orderId: String(order._id), status: order.status, revisedTotal: newTotal }
    ).catch((err) => console.error('[Push Error]', err.message));

    return success(res, order, 'Order item cancelled and total updated successfully');
  } catch (error) {
    await session.abortTransaction();
    return res.status(400).json({ success: false, message: error.message || 'Failed to cancel order item' });
  } finally {
    session.endSession();
  }
};
