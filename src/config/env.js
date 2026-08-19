import dotenv from 'dotenv';

dotenv.config();

const requiredVars = ['MONGO_URI', 'JWT_SECRET'];

requiredVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required env variable: ${key}`);
  }
});

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || '*',
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || 'true') === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  },
  dnsServers: String(process.env.DNS_SERVERS || '')
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean),
  useCloudinary: String(process.env.USE_CLOUDINARY || 'false') === 'true',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || ''
  },
  defaultSeller: {
    enabled: String(process.env.DEFAULT_SELLER_ENABLED || 'true') === 'true',
    name: process.env.DEFAULT_SELLER_NAME || 'AP Enterprises Wholesale',
    email: process.env.DEFAULT_SELLER_EMAIL || 'seller@apenterprises.com',
    password: process.env.DEFAULT_SELLER_PASSWORD || '',
    companyName: process.env.DEFAULT_SELLER_COMPANY || 'AP Enterprises'
  },
  admin: {
    enabled: String(process.env.ADMIN_SEED_ENABLED || 'true') === 'true',
    name: process.env.ADMIN_NAME || 'Aniket Singh',
    email: String(process.env.ADMIN_EMAIL || 'aniket.singh9322@gmail.com').trim().toLowerCase(),
    password: process.env.ADMIN_PASSWORD || '',
    companyName: process.env.ADMIN_COMPANY || 'AP Enterprises'
  }
};
