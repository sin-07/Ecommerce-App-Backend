import mongoose from 'mongoose';
import dns from 'dns';
import { env } from './env.js';

export const connectDb = async () => {
  try {
    if (env.dnsServers.length > 0) {
      dns.setServers(env.dnsServers);
    }

    await mongoose.connect(env.mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    console.log('MongoDB connected');
  } catch (error) {
    const isSrvDnsError = error?.code === 'ECONNREFUSED' && String(error?.syscall || '').includes('querySrv');

    if (isSrvDnsError) {
      console.error(
        'MongoDB SRV lookup failed. This is usually a local DNS/network issue, not a password issue.\n' +
          'Fixes: use Atlas Network Access to allow your IP, switch to a standard mongodb:// connection string, or try a different DNS/VPN.'
      );
    }

    throw error;
  }
};
