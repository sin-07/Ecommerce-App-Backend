import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true,
      index: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    stock: {
      type: Number,
      required: true,
      min: 0
    },
    minOrderQuantity: {
      type: Number,
      default: 1,
      min: 1
    },
    sku: {
      type: String,
      trim: true,
      default: '',
      index: true
    },
    imageUrl: {
      type: String,
      default: ''
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    availabilityStatus: {
      type: String,
      enum: ['active', 'out_of_stock', 'unavailable'],
      default: 'active',
      index: true
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true
    },
    isBestSeller: {
      type: Boolean,
      default: false,
      index: true
    },
    unit: {
      type: String,
      trim: true,
      default: 'piece'
    },
    packSize: {
      type: String,
      trim: true,
      default: ''
    },
    badge: {
      type: String,
      trim: true,
      default: ''
    },
    tags: {
      type: [String],
      default: []
    },
    images: {
      type: [String],
      default: []
    },
    pricingTiers: {
      type: [
        {
          minQty: { type: Number, required: true },
          maxQty: { type: Number, default: null },
          price: { type: Number, required: true },
          discountPercentage: { type: Number, default: 0 }
        }
      ],
      default: []
    },
    specifications: {
      type: [
        {
          key: { type: String, required: true, trim: true },
          value: { type: String, required: true, trim: true }
        }
      ],
      default: []
    },
    priceHistory: {
      type: [
        {
          price: { type: Number, required: true },
          date: { type: Date, default: Date.now }
        }
      ],
      default: []
    }
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text', category: 'text' });
productSchema.index({ isActive: 1, createdAt: -1 });
productSchema.index({ isActive: 1, category: 1, createdAt: -1 });
productSchema.index({ isActive: 1, isFeatured: 1, createdAt: -1 });
productSchema.index({ isActive: 1, isBestSeller: 1, createdAt: -1 });
productSchema.index({ isActive: 1, stock: 1 });
productSchema.index({ seller: 1, isActive: 1 });

export const Product = mongoose.model('Product', productSchema);
