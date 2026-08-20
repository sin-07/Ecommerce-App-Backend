import mongoose from 'mongoose';
import { connectDb } from '../config/db.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { OtpVerification } from '../models/OtpVerification.js';
import { seedAdminUser } from './seedDefaultUsers.js';

export const runSafeDatabaseCleanup = async () => {
  await connectDb();

  console.log('\n=== RUNNING SAFE DATABASE CLEANUP ===');

  // 1. Clean up test OTP verification records
  const otpDeleted = await OtpVerification.deleteMany({
    $or: [
      { email: { $regex: /test/i } },
      { email: { $regex: /example\.com/i } }
    ]
  });
  console.log(`[Cleanup] Deleted ${otpDeleted.deletedCount} test OTP records.`);

  // 2. Identify and remove dummy seller accounts (e.g. admin@gmail.com with role seller or seller@apenterprises.com)
  const dummySellerEmails = ['seller@apenterprises.com', 'admin@gmail.com', 'seller@example.com'];
  const sellerDeleted = await User.deleteMany({
    $or: [
      { email: { $in: dummySellerEmails } },
      { email: { $regex: /test_buyer/i } },
      { email: { $regex: /example\.com/i } }
    ]
  });
  console.log(`[Cleanup] Deleted ${sellerDeleted.deletedCount} dummy test seller/user records.`);

  // 3. Ensure the ONE real Admin account is configured
  await seedAdminUser();

  // 4. Report remaining users
  const remainingUsers = await User.find({}).select('name email role companyName').lean();
  console.log(`\n[Database Summary] Remaining Users (${remainingUsers.length}):`);
  remainingUsers.forEach((u, i) => {
    console.log(`  ${i + 1}. [${u.role.toUpperCase()}] ${u.name} <${u.email}> (${u.companyName || 'No Company'})`);
  });

  // 5. Report remaining products
  const remainingProducts = await Product.find({}).select('name category price stock unit imageUrl isActive').lean();
  console.log(`\n[Database Summary] Remaining Products (${remainingProducts.length}):`);
  remainingProducts.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name} | Cat: ${p.category} | Price: ₹${p.price} | Unit: ${p.unit} | Stock: ${p.stock} | Active: ${p.isActive}`);
  });

  console.log('\n=== DATABASE CLEANUP COMPLETE ===\n');
};
