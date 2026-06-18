import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema({
  batchId: { type: String, unique: true, required: true },
  receiveDate: Date,
  clientId: String,
  clientName: String,
  poNumber: String,
  fabricId: String,
  designId: String,
  designName: String,
  shade: String,
  bleachLevel: String,
  inputWeightKg: Number,
  outputWeightKg: Number,
  totalDelta: Number,
  totalMeters: Number,
  processStart: Date,
  plannedDelivery: Date,
  actualDelivery: Date,
  delayDays: Number,
  ratePerMetreInr: Number,
  invoiceValueInr: Number,
  status: String
}, { timestamps: true });

const Batch = mongoose.model('Batch', batchSchema);
export default Batch;
