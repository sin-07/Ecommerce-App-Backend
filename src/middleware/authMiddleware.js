import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

// In-memory cache: token → { user, expiresAt }
// Avoids a DB round-trip on every authenticated request.
const userCache = new Map();

const getCachedUser = (token) => {
  const entry = userCache.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    userCache.delete(token);
    return null;
  }
  return entry.user;
};

const setCachedUser = (token, user, jwtExp) => {
  // Cache until 60 s before JWT expiry to be safe
  const expiresAt = jwtExp * 1000 - 60_000;
  userCache.set(token, { user, expiresAt });
};

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.jwtSecret);

    // Return cached user if available
    const cached = getCachedUser(token);
    if (cached) {
      req.user = cached;
      return next();
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid user' });
    }

    setCachedUser(token, user, decoded.exp);
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

export const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  return next();
};
