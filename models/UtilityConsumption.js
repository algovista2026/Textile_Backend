import mongoose from "mongoose";

const utilityconsumptionSchema = new mongoose.Schema(
  {
    utilityId: { type: String, unique: true },
    batchId: { type: String, required: true },
    stageName: String,
    waterUsage: Number,
    powerUsage: Number,
    gasUsage: Number,
    steamUsage: Number,
    cost: Number,
  },
  { timestamps: true },
);

const UtilityConsumption = mongoose.model(
  "UtilityConsumption",
  utilityconsumptionSchema,
);
export default UtilityConsumption;
