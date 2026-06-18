import mongoose from 'mongoose';

const warehouseSchema = new mongoose.Schema({
  warehouseCode: { type: String, unique: true, required: true },
  warehouseName: { type: String, required: true },
  location: { type: String },
  managerName: { type: String },
  contactNumber: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

export default mongoose.model('Warehouse', warehouseSchema);
