import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    items: {
      type: [orderItemSchema],
      validate: [(arr) => arr.length > 0, 'Order must include at least one item']
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    customerName: {
      type: String,
      required: true,
      trim: true
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['pending', 'packed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
      index: true
    },
    shippingAddress: {
      type: String,
      required: true
    },
    notes: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

export const Order = mongoose.model('Order', orderSchema);
