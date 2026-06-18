import mongoose from 'mongoose';

const warehouseStockSchema = new mongoose.Schema({
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  material: { type: mongoose.Schema.Types.ObjectId, ref: 'Chemical', required: true },
  currentStock: { type: Number, default: 0 },
  value: { type: Number, default: 0 }
}, { timestamps: true });

warehouseStockSchema.index({ warehouse: 1, material: 1 }, { unique: true });

export default mongoose.model('WarehouseStock', warehouseStockSchema);
