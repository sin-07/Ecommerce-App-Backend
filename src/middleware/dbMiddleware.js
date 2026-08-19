import { connectDb, isDbConnected } from '../config/db.js';
import { env } from '../config/env.js';

/**
 * Middleware ensuring MongoDB is connected before handling API operations.
 * If MONGO_URI is missing, responds with HTTP 503 rather than crashing the process.
 */
export const requireDb = async (req, res, next) => {
  // Allow healthcheck and root routes without DB check
  if (req.path === '/health' || req.path === '/') {
    return next();
  }

  if (!env.isDbConfigured) {
    return res.status(503).json({
      success: false,
      message: 'Database configuration missing: MONGO_URI is not set. Please configure MONGO_URI in your Vercel Project Environment Variables.',
      error: 'MISSING_MONGO_URI'
    });
  }

  if (isDbConnected()) {
    return next();
  }

  try {
    await connectDb();
    next();
  } catch (err) {
    return res.status(503).json({
      success: false,
      message: 'Unable to connect to the database. Please verify your MongoDB connection string and Atlas IP whitelist (0.0.0.0/0).',
      error: 'DATABASE_UNAVAILABLE'
    });
  }
};
