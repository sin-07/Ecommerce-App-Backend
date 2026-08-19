import app from './app.js';
import { connectDb } from './config/db.js';
import { env, checkConfigStatus } from './config/env.js';
import { seedDefaultUsers } from './utils/seedDefaultUsers.js';
import './config/cloudinary.js';

export default app;

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION);

// Only listen on a port when running as a standalone Node.js server
if (!isServerless && process.env.NODE_ENV !== 'test') {
  const start = async () => {
    const status = checkConfigStatus();
    if (!status.valid) {
      status.issues.forEach((issue) => console.warn(`[Startup Warning] ${issue}`));
    }

    try {
      if (env.isDbConfigured) {
        await connectDb();
        await seedDefaultUsers().catch((err) => {
          console.warn('[Seed Warning]', err.message);
        });
      } else {
        console.warn('[Startup] MONGO_URI is not configured yet. Server is running in configuration-standby mode.');
      }

      app.listen(env.port, () => {
        console.log(`[AP Enterprises API] Server running on port ${env.port}`);
      });
    } catch (error) {
      console.error('Failed to start server:', error.message);
      // Still listen so healthcheck and diagnostic endpoints can respond
      app.listen(env.port, () => {
        console.log(`[AP Enterprises API] Server running in fallback mode on port ${env.port}`);
      });
    }
  };

  start();
}
