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
import { uploadDir } from './middleware/uploadMiddleware.js';
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

// CORS Configuration for Mobile and Web Clients
const ALLOWED_ORIGINS = [
  'https://ecommerce-app-frontend-six-olive.vercel.app',
  'https://ecommerce-app-backend-blush.vercel.app',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://localhost:8081',
  'http://localhost:19006'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (React Native Mobile App, Expo, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Check allowed list
      if (ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }

      // Check custom configured CLIENT_URL
      if (env.clientUrl && env.clientUrl !== '*') {
        const customAllowed = env.clientUrl.split(',').map((u) => u.trim());
        if (customAllowed.includes(origin)) {
          return callback(null, true);
        }
      }

      // Allow wildcard in development or fallback
      if (env.clientUrl === '*' || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }

      return callback(null, true);
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
app.use('/uploads', express.static(uploadDir));

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

// Dynamic App Configuration & Force Update Endpoint (instant, DB-free response)
app.get('/api/app-config', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      ...env.appVersion,
      title: 'Update Required',
      message: 'A critical update is available for EggKart. To continue placing orders and managing your wholesale account, please update to the latest version.',
      releaseNotes: [
        'Mandatory performance & security updates',
        'Streamlined fast minimalist startup',
        'Direct business email verification & order routing'
      ]
    }
  });
});

// Enforce minimum app version on all /api routes if requested by client
app.use('/api', (req, res, next) => {
  if (req.path === '/app-config') return next();

  const clientVersionCode = Number(req.headers['x-app-version-code']);
  if (
    env.appVersion.forceUpdate &&
    clientVersionCode &&
    clientVersionCode < env.appVersion.minVersionCode
  ) {
    return res.status(426).json({
      success: false,
      code: 'UPDATE_REQUIRED',
      message: 'Please update EggKart to continue.',
      data: env.appVersion
    });
  }
  next();
});

// Attach database connection check to /api routes
app.use('/api', requireDb, routes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

export default app;
