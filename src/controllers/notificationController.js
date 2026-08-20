import { Notification } from '../models/Notification.js';
import { success } from '../utils/apiResponse.js';

export const getNotifications = async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments({ recipient: req.user._id }),
    Notification.countDocuments({ recipient: req.user._id, isRead: false })
  ]);

  return success(
    res,
    {
      notifications,
      unreadCount,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    },
    'Notifications fetched'
  );
};

export const getUnreadCount = async (req, res) => {
  const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
  return success(res, { unreadCount }, 'Unread count fetched');
};

export const markAsRead = async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    recipient: req.user._id
  });

  if (!notification) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }

  notification.isRead = true;
  await notification.save();

  return success(res, notification, 'Notification marked as read');
};

export const markAllAsRead = async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { $set: { isRead: true } });
  return success(res, null, 'All notifications marked as read');
};

export const createInAppNotification = async ({ recipient, title, message, type, metadata }) => {
  try {
    return await Notification.create({
      recipient,
      title,
      message,
      type: type || 'system',
      metadata: metadata || {},
      isRead: false
    });
  } catch (err) {
    console.error('[InApp Notification Error]:', err.message);
    return null;
  }
};
