import 'express-async-errors';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { env } from './config/env.js';
import { isDbConnected } from './config/db.js';
import { requireDb } from './middleware/dbMiddleware.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import routes from './routes/index.js';

const app = express();

// Security & performance middleware
app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);
app.use(compression());

// Universal CORS handling
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin || env.clientUrl === '*') return callback(null, true);
      const allowed = env.clientUrl.split(',').map((u) => u.trim());
      if (allowed.includes(origin) || allowed.includes('*')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive fallback for seamless API access
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.use(morgan('dev'));
}

// Rate limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/auth', authLimiter);

// Static uploads (for local dev; Cloudinary used in cloud)
app.use('/uploads', express.static(path.resolve('uploads')));

// Root & Healthcheck endpoints (work even if DB is not yet connected)
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    service: 'AP Enterprises - B2B Beverage Commerce API',
    status: 'online',
    version: '1.0.0',
    database: env.isDbConfigured ? (isDbConnected() ? 'connected' : 'ready_to_connect') : 'not_configured'
  });
});

app.get('/health', (_req, res) => {
  const connected = isDbConnected();
  res.status(200).json({
    success: true,
    status: 'healthy',
    database: connected ? 'connected' : env.isDbConfigured ? 'connecting' : 'missing_mongo_uri',
    timestamp: new Date().toISOString()
  });
});

// Attach database connection check to /api routes
app.use('/api', requireDb, routes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

export default app;
