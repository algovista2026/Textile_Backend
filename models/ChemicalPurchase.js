import mongoose from "mongoose";

const chemicalPurchaseSchema = new mongoose.Schema(
  {
    purchaseId: { type: String, unique: true },
    chemicalName: { type: String, required: true },
    quantity: { type: Number, required: true },
    vendor: { type: String },
    invoiceNumber: { type: String },
    warehouseName: { type: String },
  },
  { timestamps: true }
);

const ChemicalPurchase = mongoose.model("ChemicalPurchase", chemicalPurchaseSchema);
export default ChemicalPurchase;
