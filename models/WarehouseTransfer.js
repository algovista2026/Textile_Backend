import mongoose from 'mongoose';

const warehouseTransferSchema = new mongoose.Schema({
  fromWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  toWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  material: { type: mongoose.Schema.Types.ObjectId, ref: 'Chemical', required: true },
  quantity: { type: Number, required: true },
  remarks: { type: String },
  transferDate: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('WarehouseTransfer', warehouseTransferSchema);
