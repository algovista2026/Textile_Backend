import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Batch from './models/Batch.js';
import StageEvent from './models/StageEvent.js';
import QualityInspection from './models/QualityInspection.js';
import UtilityConsumption from './models/UtilityConsumption.js';

dotenv.config();

const seedDashboard = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/textile-erp');
    console.log('MongoDB Connected');

    // Seed Batches
    const batches = [];
    const statuses = ['Pending', 'Running', 'Completed', 'Completed', 'Completed', 'Delayed'];
    for (let i = 1; i <= 30; i++) {
      batches.push({
        batchId: `B-${1000 + i}`,
        clientId: `CUST-${Math.floor(Math.random() * 5) + 1}`,
        fabricId: `FAB-${Math.floor(Math.random() * 5) + 1}`,
        quantity: Math.floor(Math.random() * 5000) + 1000,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        startDate: new Date(Date.now() - Math.floor(Math.random() * 10000000000)),
      });
    }
    await Batch.deleteMany({});
    await Batch.insertMany(batches);

    // Seed Stage Events (Avg Process Duration)
    const stages = [];
    for (let i = 1; i <= 40; i++) {
      stages.push({
        eventId: `EV-${1000 + i}`,
        batchId: `B-${1000 + Math.floor(Math.random() * 30)}`,
        stageName: 'Dyeing',
        status: 'Completed',
        duration: Math.floor(Math.random() * 8) + 2, // 2 to 10 hours
      });
    }
    await StageEvent.deleteMany({});
    await StageEvent.insertMany(stages);

    // Seed Quality Inspections (Rejection Rate)
    const inspections = [];
    for (let i = 1; i <= 20; i++) {
      inspections.push({
        inspectionId: `QI-${1000 + i}`,
        batchId: `B-${1000 + Math.floor(Math.random() * 30)}`,
        rejectionPercent: Math.random() * 5, // 0 to 5%
      });
    }
    await QualityInspection.deleteMany({});
    await QualityInspection.insertMany(inspections);

    // Seed Utility Consumption (Utility Cost)
    const utilities = [];
    for (let i = 1; i <= 15; i++) {
      utilities.push({
        utilityId: `UT-${1000 + i}`,
        batchId: `B-${1000 + Math.floor(Math.random() * 30)}`,
        type: 'Electricity',
        cost: Math.floor(Math.random() * 5000) + 1000,
      });
    }
    await UtilityConsumption.deleteMany({});
    await UtilityConsumption.insertMany(utilities);

    console.log('Dashboard Data Seeded Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding dashboard:', error);
    process.exit(1);
  }
};

seedDashboard();
