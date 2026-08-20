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
      required: false
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    imageUrl: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      default: 'General'
    },
    unit: {
      type: String,
      default: 'piece'
    },
    packSize: {
      type: String,
      default: ''
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
    subtotal: {
      type: Number,
      default: 0,
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

const deliveryAddressSchema = new mongoose.Schema(
  {
    contactName: { type: String, default: '' },
    phone: { type: String, default: '' },
    addressLine1: { type: String, default: '' },
    addressLine2: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' },
    country: { type: String, default: 'India' },
    notes: { type: String, default: '' },
    // Backward compatibility aliases
    fullName: { type: String, default: '' },
    street: { type: String, default: '' },
    postalCode: { type: String, default: '' }
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
    subtotal: {
      type: Number,
      default: 0,
      min: 0
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0
    },
    amountDue: {
      type: Number,
      default: 0,
      min: 0
    },
    paymentStatus: {
      type: String,
      enum: ['DUE', 'PARTIALLY_PAID', 'PAID'],
      default: 'DUE',
      index: true
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
      enum: [
        'pending',
        'processing',
        'confirmed',
        'packed',
        'shipped',
        'dispatched',
        'delivered',
        'cancelled'
      ],
      default: 'pending',
      index: true
    },
    shippingAddress: {
      type: String,
      required: true
    },
    deliveryAddress: {
      type: deliveryAddressSchema,
      default: () => ({})
    },
    deliveryAddressDetails: {
      type: deliveryAddressSchema,
      default: () => ({})
    },
    notes: {
      type: String,
      default: ''
    },
    estimatedDeliveryDate: {
      type: Date,
      default: null
    },
    estimatedDeliverySlot: {
      type: String,
      default: ''
    },
    dispatchedAt: {
      type: Date,
      default: null
    },
    deliveredAt: {
      type: Date,
      default: null
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      index: true
    }
  },
  { timestamps: true }
);

orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

export const Order = mongoose.model('Order', orderSchema);
