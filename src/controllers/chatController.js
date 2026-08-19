import { Conversation } from '../models/Conversation.js';
import { Order } from '../models/Order.js';
import { success } from '../utils/apiResponse.js';

const resolveSellerId = (order) => {
  const sellerIds = [...new Set(order.items.map((item) => String(item.seller)))];
  return sellerIds[0];
};

const authorizeConversation = (order, user) => {
  const allowed = [String(order.buyer), resolveSellerId(order), 'admin'];
  if (!allowed.includes(user.role === 'admin' ? 'admin' : String(user._id))) {
    const error = new Error('Forbidden');
    error.statusCode = 403;
    throw error;
  }
};

export const getConversationByOrder = async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  authorizeConversation(order, req.user);

  const sellerId = resolveSellerId(order);
  const conversation =
    (await Conversation.findOne({ order: order._id })
      .populate('buyer', 'name companyName email')
      .populate('seller', 'name companyName email')
      .populate('messages.sender', 'name role')) ||
    (await Conversation.create({ order: order._id, buyer: order.buyer, seller: sellerId, messages: [] }));

  if (!conversation.populated('buyer')) {
    await conversation.populate('buyer', 'name companyName email');
    await conversation.populate('seller', 'name companyName email');
    await conversation.populate('messages.sender', 'name role');
  }

  return success(res, conversation, 'Conversation fetched');
};

export const sendConversationMessage = async (req, res) => {
  const { text } = req.body;
  if (!text || !String(text).trim()) {
    return res.status(400).json({ success: false, message: 'text is required' });
  }

  const order = await Order.findById(req.params.orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  authorizeConversation(order, req.user);

  const sellerId = resolveSellerId(order);
  const conversation = await Conversation.findOneAndUpdate(
    { order: order._id },
    { $setOnInsert: { order: order._id, buyer: order.buyer, seller: sellerId }, $push: { messages: { sender: req.user._id, text: String(text).trim() } } },
    { new: true, upsert: true }
  )
    .populate('buyer', 'name companyName email')
    .populate('seller', 'name companyName email')
    .populate('messages.sender', 'name role');

  return success(res, conversation, 'Message sent', 201);
};
