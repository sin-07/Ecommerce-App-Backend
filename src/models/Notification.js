import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['order', 'payment', 'delivery', 'stock', 'reorder', 'system'],
      default: 'system',
      index: true
    },
    metadata: {
      orderId: { type: String, default: null },
      productId: { type: String, default: null },
      status: { type: String, default: null }
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date,
      default: null,
      index: true
    }
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
// 12-hour TTL auto-cleanup after a notification is marked read (43,200 seconds)
notificationSchema.index({ readAt: 1 }, { expireAfterSeconds: 12 * 60 * 60 });

export const Notification = mongoose.model('Notification', notificationSchema);
