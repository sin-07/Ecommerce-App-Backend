import { connectDb } from '../config/db.js';
import { seedAdminUser } from '../utils/seedDefaultUsers.js';
import mongoose from 'mongoose';

async function run() {
  try {
    console.log('[syncAdmin] Connecting to MongoDB...');
    await connectDb();
    console.log('[syncAdmin] Running seedAdminUser...');
    await seedAdminUser();
    console.log('[syncAdmin] Successfully synced Admin account to database!');
  } catch (err) {
    console.error('[syncAdmin] Error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
