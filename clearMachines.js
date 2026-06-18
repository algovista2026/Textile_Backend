import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const clearMachines = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb+srv://algovistaai:xMUB2r87zN6yZ1Q4@cluster0.p7102.mongodb.net/school_erp?retryWrites=true&w=majority&appName=Cluster0");
    const db = mongoose.connection;
    await db.collection('machines').deleteMany({});
    console.log("All machines deleted successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

clearMachines(); 
