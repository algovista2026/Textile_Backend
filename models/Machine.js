import mongoose from 'mongoose';

const machineSchema = new mongoose.Schema({
  machineId: { type: String, unique: true }, 
  name: String, 
  type: String, 
  status: {
    type: String,
    enum: ["Available", "Occupied", "Running", "Maintenance"],
    default: "Available"
  },
  currentJob: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductionDesign",
    default: null
  }
}, { timestamps: true });

const Machine = mongoose.model('Machine', machineSchema);
export default Machine;
