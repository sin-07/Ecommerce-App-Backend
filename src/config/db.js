import mongoose from 'mongoose';
import dns from 'dns';
import { env } from './env.js';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Connects to MongoDB with connection caching for serverless environments (Vercel).
 * Reuses existing active connection if already established across warm invocations.
 */
export const connectDb = async () => {
  // If already connected, reuse existing connection immediately
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (mongoose.connection.readyState === 1) {
    cached.conn = mongoose.connection;
    return cached.conn;
  }

  // If connection is in-flight, await the existing promise
  if (cached.promise) {
    return cached.promise;
  }

  if (!env.isDbConfigured || !env.mongoUri) {
    throw new Error(
      'Missing MONGO_URI. Please configure MONGO_URI in your Vercel Project Settings > Environment Variables.'
    );
  }

  try {
    if (env.dnsServers && env.dnsServers.length > 0) {
      try {
        dns.setServers(env.dnsServers);
      } catch (dnsErr) {
        // Fallback gracefully if custom DNS servers fail
        console.warn('[DB] Custom DNS server setup skipped:', dnsErr.message);
      }
    }

    cached.promise = mongoose.connect(env.mongoUri, {
      maxPoolSize: 10,
      minPoolSize: 0,
      maxIdleTimeMS: 30000,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 7000,
      socketTimeoutMS: 45000,
      bufferCommands: false
    });

    cached.conn = await cached.promise;
    console.log('[MongoDB] Connected successfully (pooled & cached)');
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;

    const isSrvDnsError =
      error?.code === 'ECONNREFUSED' &&
      String(error?.syscall || '').includes('querySrv');

    if (isSrvDnsError) {
      console.error(
        '[MongoDB] SRV lookup error. Please verify Atlas Network Access allows 0.0.0.0/0 (all IPs) for Vercel deployment.'
      );
    } else {
      console.error('[MongoDB] Connection error:', error.message);
    }

    throw error;
  }
};

/**
 * Returns true if MongoDB is currently connected.
 */
export const isDbConnected = () => {
  return mongoose.connection.readyState === 1;
};
