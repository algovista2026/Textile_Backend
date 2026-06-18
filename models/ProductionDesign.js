import mongoose from "mongoose";

const productionDesignSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductionOrder",
    required: true
  },
  designNo: {
    type: String,
    required: true
  },
  meterEntries: {
    type: [Number],
    default: []
  },
  totalMeter: {
    type: Number,
    default: 0
  },
  quality: {
    type: String // GSM
  },
  machine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Machine",
    default: null
  },
  silicateStartDate: {
    type: Date
  },
  silicateEndDate: {
    type: Date
  },
  washingStartDate: {
    type: Date
  },
  washingEndDate: {
    type: Date
  },
  processStatus: {
    type: String,
    enum: ["Pending", "Machine Allocated", "Silicate Running", "Silicate Completed", "Washing Running", "Washing Completed", "Finished", "Hold", "Cancelled"],
    default: "Pending"
  }
}, { timestamps: true });

// Auto calculate totalMeter before saving
productionDesignSchema.pre("save", function () {
  if (this.meterEntries && this.meterEntries.length > 0) {
    this.totalMeter = this.meterEntries.reduce((sum, val) => sum + val, 0);
  } else {
    this.totalMeter = 0;
  }
});

const ProductionDesign = mongoose.model("ProductionDesign", productionDesignSchema);
export default ProductionDesign;
