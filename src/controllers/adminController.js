import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { paginated, success } from '../utils/apiResponse.js';

export const dashboard = async (_req, res) => {
  const [users, totalProducts, activeProducts, lowStock, outOfStock, featuredProducts, orders, totalRevenueAgg] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: true, stock: { $gt: 0, $lt: 10 } }),
    Product.countDocuments({ stock: 0 }),
    Product.countDocuments({ isActive: true, isFeatured: true }),
    Order.countDocuments(),
    Order.aggregate([{ $group: { _id: null, total: { $sum: '$totalAmount' } } }])
  ]);

  const revenue = totalRevenueAgg[0]?.total || 0;

  return success(res, {
    users,
    products: activeProducts,
    totalProducts,
    activeProducts,
    lowStock,
    outOfStock,
    featuredProducts,
    orders,
    totalOrders: orders,
    revenue
  }, 'Dashboard metrics');
};

export const getUsers = async (_req, res) => {
  const users = await User.find({}).select('-password').sort({ createdAt: -1 });
  return success(res, users, 'Users fetched');
};

export const updateUserStatus = async (req, res) => {
  const { isActive } = req.body;
  if (String(req.user._id) === String(req.params.id) && !Boolean(isActive)) {
    return res.status(400).json({ success: false, message: 'You cannot deactivate your own admin account.' });
  }
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  user.isActive = Boolean(isActive);
  await user.save();

  return success(res, { id: user._id, isActive: user.isActive }, 'User status updated');
};

export const removeUser = async (req, res) => {
  if (String(req.user._id) === String(req.params.id)) {
    return res.status(400).json({ success: false, message: 'You cannot delete your own admin account.' });
  }
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  await User.findByIdAndDelete(req.params.id);
  return success(res, null, 'User deleted');
};

export const getAdminProducts = async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit || 12)));
  const skip = (page - 1) * limit;
  const query = {};
  const search = String(req.query.search || '').trim();
  const status = String(req.query.status || 'all');
  const sortKey = String(req.query.sort || 'newest');

  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { name: { $regex: escaped, $options: 'i' } },
      { category: { $regex: escaped, $options: 'i' } },
      { sku: { $regex: escaped, $options: 'i' } }
    ];
  }

  if (status === 'active') query.isActive = true;
  if (status === 'inactive') query.isActive = false;
  if (status === 'featured') query.isFeatured = true;
  if (status === 'low-stock') query.stock = { $gt: 0, $lt: 10 };
  if (status === 'out-of-stock') query.stock = 0;

  const sort = sortKey === 'price-low' ? { price: 1 } : sortKey === 'price-high' ? { price: -1 } : sortKey === 'stock-low' ? { stock: 1 } : { createdAt: -1 };
  const [products, total] = await Promise.all([
    Product.find(query).populate('seller', 'name email').sort(sort).skip(skip).limit(limit),
    Product.countDocuments(query)
  ]);

  return paginated(res, products, { total, page, limit, totalPages: Math.ceil(total / limit) }, 'Products fetched');
};
