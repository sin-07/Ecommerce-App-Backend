import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { paginated, success } from '../utils/apiResponse.js';

export const dashboard = async (_req, res) => {
  const [userCount, productStatsAgg, orderStatsAgg] = await Promise.all([
    User.countDocuments(),
    Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          activeProducts: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
          lowStock: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$isActive', true] },
                    { $gt: ['$stock', 0] },
                    { $lt: ['$stock', 10] }
                  ]
                },
                1,
                0
              ]
            }
          },
          outOfStock: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } },
          featuredProducts: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$isActive', true] },
                    { $eq: ['$isFeatured', true] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]),
    Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      }
    ])
  ]);

  const pStats = productStatsAgg[0] || {
    totalProducts: 0,
    activeProducts: 0,
    lowStock: 0,
    outOfStock: 0,
    featuredProducts: 0
  };
  const oStats = orderStatsAgg[0] || { totalOrders: 0, revenue: 0 };

  return success(
    res,
    {
      users: userCount,
      products: pStats.activeProducts,
      totalProducts: pStats.totalProducts,
      activeProducts: pStats.activeProducts,
      lowStock: pStats.lowStock,
      outOfStock: pStats.outOfStock,
      featuredProducts: pStats.featuredProducts,
      orders: oStats.totalOrders,
      totalOrders: oStats.totalOrders,
      revenue: Math.round(Number(oStats.revenue || 0) * 100) / 100
    },
    'Dashboard metrics'
  );
};

export const getUsers = async (req, res) => {
  const page = req.query.page ? Math.max(1, Number(req.query.page)) : null;
  const limit = req.query.limit ? Math.min(50, Math.max(1, Number(req.query.limit))) : (page ? 20 : null);
  const role = req.query.role ? String(req.query.role).trim() : null;
  const search = req.query.search ? String(req.query.search).trim() : null;

  const query = {};
  if (role) query.role = role;
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { name: { $regex: escaped, $options: 'i' } },
      { email: { $regex: escaped, $options: 'i' } },
      { companyName: { $regex: escaped, $options: 'i' } },
      { phone: { $regex: escaped, $options: 'i' } }
    ];
  }

  if (page) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query)
    ]);
    return paginated(res, users, { total, page, limit, totalPages: Math.ceil(total / limit) }, 'Users fetched');
  }

  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

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

export const updateProductStatus = async (req, res) => {
  const { isActive } = req.body;
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  product.isActive = Boolean(isActive);
  await product.save();

  return success(res, product, `Product marked as ${product.isActive ? 'active' : 'inactive'}`);
};
