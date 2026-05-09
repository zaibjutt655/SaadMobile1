require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = require('./config/db');
const { User } = require('./models');

const resetOwnerPassword = async () => {
  try {
    await connectDB();

    // Find owner
    const owner = await User.findOne({ role: 'owner' });

    if (!owner) {
      console.log('❌ No owner account found');
      process.exit(1);
    }

    // Set new password
    const newPassword = 'owner123';

    // Ensure name field exists (required by schema)
    if (!owner.name) {
      owner.name = 'Owner';
    }

    owner.password = newPassword; // Will be hashed by pre-save hook
    await owner.save();

    console.log('✅ Owner password reset successfully!');
    console.log('Username:', owner.username);
    console.log('New Password:', newPassword);
    console.log('\n⚠️  Please change this password after logging in!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

resetOwnerPassword();
