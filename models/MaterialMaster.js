import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema({
  materialCode: { type: String, unique: true, required: true },
  materialName: { type: String, required: true },
  category: { type: String, required: true }, // Chemicals, Dyes, Consumables, Raw Material
  unit: { type: String, required: true },
  standardRate: { type: Number, default: 0 },
  minimumStock: { type: Number, default: 0 },
  maximumStock: { type: Number, default: 0 },
  reorderLevel: { type: Number, default: 0 },
  reorderQty: { type: Number, default: 0 },
  leadTimeDays: { type: Number, default: 0 },
  supplier: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  description: { type: String },
  currentStock: { type: Number, default: 0 },
  totalValue: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('MaterialMaster', materialSchema);
