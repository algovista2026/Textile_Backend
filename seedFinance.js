import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Invoice from './models/Invoice.js';

dotenv.config();

const seedInvoices = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/textile-erp');
    console.log('MongoDB Connected');

    const invoices = [];
    for (let i = 1; i <= 20; i++) {
      invoices.push({
        invoiceId: `INV-2026-${String(i).padStart(3, '0')}`,
        clientId: `CUST-${Math.floor(Math.random() * 5) + 1}`,
        batchId: `B-${Math.floor(Math.random() * 100) + 1000}`,
        amount: Math.floor(Math.random() * 50000) + 10000,
        status: Math.random() > 0.5 ? 'Paid' : (Math.random() > 0.5 ? 'Pending' : 'Overdue'),
        issueDate: new Date(Date.now() - Math.floor(Math.random() * 10000000000)),
        dueDate: new Date(Date.now() + Math.floor(Math.random() * 10000000000))
      });
    }

    await Invoice.insertMany(invoices);
    console.log('20 Invoices inserted successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding invoices:', error);
    process.exit(1);
  }
};

seedInvoices();
