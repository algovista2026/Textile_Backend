import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  invoiceNo: { type: String, unique: true },
  batchId: { type: String, required: true },
  clientId: String,
  clientName: String,
  invoiceDate: Date,
  currency: String,
  fxRate: Number,
  billedMetres: Number,
  ratePerMetreInr: Number,
  taxableValueInr: Number,
  cgstInr: Number,
  sgstInr: Number,
  igstInr: Number,
  totalInr: Number,
  paymentTermsDays: Number,
  dueDate: Date,
  paymentStatus: String,
  paymentDate: Date,
  daysOutstanding: Number
}, { timestamps: true });

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
