const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createMaster() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const existingMaster = await User.findOne({ role: 'master' });
    if (existingMaster) {
      console.log('Master user already exists:', existingMaster.email);
      return;
    }

    const hashedPassword = await bcrypt.hash('master@123', 10);

    const master = new User({
      username: 'Master Admin',
      email: 'master@gmail.com',
      password: hashedPassword,
      role: 'master'
    });

    await master.save();
    console.log('Master user created successfully:', master.email);

  } catch (error) {
    console.error('Error creating master user:', error);
  } finally {
    process.exit(0);
  }
}

createMaster();