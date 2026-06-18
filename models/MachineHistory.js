import mongoose from "mongoose";

const machineHistorySchema = new mongoose.Schema({
  machine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Machine",
    required: true
  },
  design: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductionDesign",
    required: true
  },
  partyName: {
    type: String
  },
  meter: {
    type: Number
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  }
}, { timestamps: true });

const MachineHistory = mongoose.model("MachineHistory", machineHistorySchema);
export default MachineHistory;
