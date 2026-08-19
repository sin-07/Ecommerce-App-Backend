import app from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { seedDefaultUsers } from './utils/seedDefaultUsers.js';
import './config/cloudinary.js';

const start = async () => {
  try {
    await connectDb();
    await seedDefaultUsers();
    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
};

start();
