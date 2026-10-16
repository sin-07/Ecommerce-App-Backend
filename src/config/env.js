import dotenv from 'dotenv';

// Load .env in local development (silently ignored in production/Vercel)
dotenv.config();

// Resolve MongoDB connection string with standard alias support
const rawMongoUri =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.MONGO_URL ||
  '';

// Resolve JWT secret with safe dev fallback
const rawJwtSecret =
  process.env.JWT_SECRET ||
  (process.env.NODE_ENV === 'production' ? '' : 'ap_enterprises_default_jwt_secret_dev');

const rawSmtpUser = (process.env.SMTP_USER || '').trim();
const rawSmtpPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');

// Enforce official business SMTP sender: automatically replace any legacy personal email
const isLegacySender = !rawSmtpUser || rawSmtpUser.toLowerCase().includes('aniket.singh07vs');
const resolvedSmtpUser = isLegacySender ? 'apenterprises.eggkart@gmail.com' : rawSmtpUser;
const resolvedSmtpPass = isLegacySender ? 'fjcbqexpcojqadyd' : (rawSmtpPass || 'fjcbqexpcojqadyd');

const rawAdminEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const resolvedAdminEmail = (!rawAdminEmail || rawAdminEmail.includes('aniket.singh07vs'))
  ? 'apenterprises.eggkart@gmail.com'
  : rawAdminEmail;

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  mongoUri: rawMongoUri ? rawMongoUri.trim() : '',
  isDbConfigured: Boolean(rawMongoUri && rawMongoUri.trim().length > 0),
  jwtSecret: rawJwtSecret ? rawJwtSecret.trim() : '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || '*',
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || 'true') === 'true',
    user: resolvedSmtpUser,
    pass: resolvedSmtpPass
  },
  dnsServers: String(process.env.DNS_SERVERS || '')
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean),
  useCloudinary: String(process.env.USE_CLOUDINARY || 'true') === 'true',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || ''
  },
  admin: {
    enabled: String(process.env.ADMIN_SEED_ENABLED || 'true') === 'true',
    name: process.env.ADMIN_NAME || 'AP Enterprises Admin',
    email: resolvedAdminEmail,
    password: process.env.ADMIN_PASSWORD || '',
    companyName: process.env.ADMIN_COMPANY || 'AP Enterprises'
  },
  appVersion: {
    minVersion: process.env.MIN_APP_VERSION || '1.0.1',
    latestVersion: process.env.LATEST_APP_VERSION || '1.0.1',
    minVersionCode: Number(process.env.MIN_APP_VERSION_CODE || 2),
    latestVersionCode: Number(process.env.LATEST_APP_VERSION_CODE || 2),
    forceUpdate: String(process.env.FORCE_UPDATE !== 'false'),
    playStoreUrl: 'market://details?id=com.apenterprises.b2b',
    playStoreWebUrl: 'https://play.google.com/store/apps/details?id=com.apenterprises.b2b'
  }
};

/**
 * Validates whether critical runtime configuration is present.
 */
export const checkConfigStatus = () => {
  const issues = [];
  if (!env.isDbConfigured) {
    issues.push('MONGO_URI is missing. Please set MONGO_URI in Vercel Environment Variables.');
  }
  if (!env.jwtSecret && env.nodeEnv === 'production') {
    issues.push('JWT_SECRET is missing in production.');
  }
  return {
    valid: issues.length === 0,
    issues
  };
};
