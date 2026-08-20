import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

/**
 * Ensures the single real Admin account exists and has proper admin credentials.
 * No dummy sellers or fake accounts are created.
 */
export const seedAdminUser = async () => {
  if (!env.admin.enabled || !env.admin.email) {
    return;
  }

  const adminEmail = env.admin.email.trim().toLowerCase();
  const existing = await User.findOne({ email: adminEmail });

  if (existing) {
    const update = {
      $set: {
        role: 'admin',
        isActive: true,
        name: env.admin.name || existing.name,
        companyName: env.admin.companyName || existing.companyName
      }
    };

    if (env.admin.password) {
      update.$set.password = await bcrypt.hash(env.admin.password, 10);
    }

    await User.updateOne({ _id: existing._id }, update);
    console.log(`[Admin Account] Verified and ready: ${adminEmail}`);
    return;
  }

  if (!env.admin.password) {
    console.warn(`[Admin Account] ${adminEmail} was not created because ADMIN_PASSWORD is not set in environment.`);
    return;
  }

  const hashedPassword = await bcrypt.hash(env.admin.password, 10);
  await User.create({
    name: env.admin.name || 'AP Administrator',
    email: adminEmail,
    password: hashedPassword,
    role: 'admin',
    companyName: env.admin.companyName || 'AP Enterprises',
    isActive: true
  });

  console.log(`[Admin Account] Created real admin account: ${adminEmail}`);
};

export const seedDefaultUsers = seedAdminUser;
