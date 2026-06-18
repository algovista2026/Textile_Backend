import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/textile-erp');
    console.log('MongoDB Connected');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const importData = async () => {
  try {
    await connectDB();
    await User.deleteMany();

    const adminUser = new User({
      username: 'Admin',
      password: 'Algo2026',
      role: 'admin',
      permissions: ['dashboard', 'inward', 'processes', 'reports', 'settings', 'user_management']
    });

    await adminUser.save();

    console.log('Admin user created successfully');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
};

importData();
