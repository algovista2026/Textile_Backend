import mongoose from "mongoose";

const productionOrderSchema = new mongoose.Schema({
  orderNo: {
    type: String,
    required: true,
    unique: true
  },
  partyName: {
    type: String,
    required: true
  },
  selvedge: {
    type: String
  },
  targetDeliveryDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ["Pending", "Machine Allocated", "Silicate Running", "Silicate Completed", "Washing Running", "Washing Completed", "Finished", "Hold", "Cancelled"],
    default: "Pending"
  }
}, { timestamps: true });

const ProductionOrder = mongoose.model("ProductionOrder", productionOrderSchema);
export default ProductionOrder;
