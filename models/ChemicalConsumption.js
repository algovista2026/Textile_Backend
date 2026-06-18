import mongoose from "mongoose";

const chemicalconsumptionSchema = new mongoose.Schema(
  {
    consumptionId: { type: String, unique: true },
    batchId: { type: String, required: true },
    stageName: String,
    chemicalId: String,
    chemicalName: String,
    theoreticalQty: Number,
    actualQty: Number,
    variance: Number,
    cost: Number,
    warehouseName: { type: String },
  },
  { timestamps: true },
);

const ChemicalConsumption = mongoose.model(
  "ChemicalConsumption",
  chemicalconsumptionSchema,
);
export default ChemicalConsumption;
