import mongoose from "mongoose";

const chemicalSchema = new mongoose.Schema(
  {
    chemicalId: { type: String, unique: true },
    chemicalName: String,
    category: String,
    unit: String,
    rateInrUnit: { type: Number, default: 0 },
    openingStock: { type: Number, default: 0 },
    purchased: { type: Number, default: 0 },
    consumed: { type: Number, default: 0 },
    currentStock: { type: Number, default: 0 },
    reorderLevel: { type: Number, default: 0 },
    supplierName: { type: String },
    remarks: { type: String },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true },
);

const Chemical = mongoose.model("Chemical", chemicalSchema);
export default Chemical;
