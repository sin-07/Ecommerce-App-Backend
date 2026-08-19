import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

export const seedDefaultUsers = async () => {
  if (env.defaultSeller.enabled && env.defaultSeller.password) {
    const hashed = await bcrypt.hash(env.defaultSeller.password, 10);
    await User.findOneAndUpdate(
      { email: env.defaultSeller.email.toLowerCase() },
      {
        name: env.defaultSeller.name,
        email: env.defaultSeller.email.toLowerCase(),
        password: hashed,
        role: 'seller',
        companyName: env.defaultSeller.companyName,
        isActive: true
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`Default seller ready: ${env.defaultSeller.email.toLowerCase()}`);
  }

  await seedAdminUser();
};

export const seedAdminUser = async () => {
  if (!env.admin.enabled || !env.admin.email) return;

  const existing = await User.findOne({ email: env.admin.email });
  if (existing) {
    const update = {
      $set: {
        role: 'admin',
        isActive: true,
        name: env.admin.name || existing.name,
        companyName: env.admin.companyName || existing.companyName
      }
    };

    // Supplying ADMIN_PASSWORD is an explicit operator action that also
    // repairs an existing admin account whose password is unknown or stale.
    if (env.admin.password) {
      update.$set.password = await bcrypt.hash(env.admin.password, 10);
    }

    await User.updateOne(
      { _id: existing._id },
      update
    );
    console.log(`Admin account ready: ${env.admin.email}`);
    return;
  }

  // A new admin can only be bootstrapped when an operator explicitly provides
  // ADMIN_PASSWORD through the server environment. Never invent or expose one.
  if (!env.admin.password) {
    console.warn(`Admin account ${env.admin.email} was not created because ADMIN_PASSWORD is not configured.`);
    return;
  }

  const hashed = await bcrypt.hash(env.admin.password, 10);
  await User.create({
    name: env.admin.name,
    email: env.admin.email,
    password: hashed,
    role: 'admin',
    companyName: env.admin.companyName,
    isActive: true
  });
  console.log(`Admin account ready: ${env.admin.email}`);
};
