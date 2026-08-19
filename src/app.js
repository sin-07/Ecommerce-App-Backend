import 'express-async-errors';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import routes from './routes/index.js';

const app = express();

// Security & performance middleware
app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: env.clientUrl === '*' ? true : env.clientUrl,
    credentials: true
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Rate limiter for auth routes — prevents brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/auth', authLimiter);

app.use('/uploads', express.static(path.resolve('uploads')));

app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'OK' });
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
