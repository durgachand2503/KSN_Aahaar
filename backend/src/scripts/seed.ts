/* ═══════════════════════════════════════════
   KSN AAHAAR — Admin Bootstrap Script

   PURPOSE: Creates the initial admin account ONLY.
   Categories, products, coupons, and all other
   business data must be created through the Admin Panel.

   USAGE:
     1. Set in your .env file:
          ADMIN_EMAIL=your-email@domain.com
          ADMIN_PASSWORD=your-secure-password
          ADMIN_NAME=Admin Name        (optional, defaults to "KSN Admin")

     2. Run once:
          npm run seed

   This script is safe to re-run — it will skip creation
   if the admin already exists. It will NEVER overwrite an
   existing admin or print the password to stdout.

   DO NOT run automatically on server start.
   DO NOT commit credentials to source control.
   ═══════════════════════════════════════════ */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ksn-aahaar';

// ── Validate required environment variables ──
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL?.trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD?.trim();
const ADMIN_NAME     = process.env.ADMIN_NAME?.trim() || 'KSN Admin';

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('\n❌ Missing required environment variables.\n');
  console.error('   Set the following in your .env file before running the seed:');
  console.error('     ADMIN_EMAIL=your-email@domain.com');
  console.error('     ADMIN_PASSWORD=your-secure-password\n');
  process.exit(1);
}

if (ADMIN_PASSWORD.length < 8) {
  console.error('\n❌ ADMIN_PASSWORD must be at least 8 characters.\n');
  process.exit(1);
}

/* ── Main Bootstrap Function ── */
async function bootstrap() {
  console.log('\n═══════════════════════════════════════════');
  console.log('  KSN AAHAAR — Admin Bootstrap');
  console.log('═══════════════════════════════════════════\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: ADMIN_EMAIL });
    if (existingAdmin) {
      console.log(`⏩ Admin account for "${ADMIN_EMAIL}" already exists.`);
      console.log('   No changes made.\n');
    } else {
      await Admin.create({
        name:     ADMIN_NAME,
        email:    ADMIN_EMAIL,
        password: ADMIN_PASSWORD, // Hashed by the pre-save hook in Admin model
        role:     'super_admin',
      });

      console.log('✅ Admin account created.');
      console.log(`   Email: ${ADMIN_EMAIL}`);
      // NOTE: Password is intentionally NOT printed here.
      console.log('\n');
    }

    console.log('─────────────────────────────────────────');
    console.log('  Next steps:');
    console.log('  1. Log in to the Admin Panel');
    console.log('  2. Create menu categories');
    console.log('  3. Add your products through the Admin Panel');
    console.log('─────────────────────────────────────────\n');

  } catch (error) {
    console.error('\n❌ Bootstrap failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.\n');
  }
}

bootstrap();
