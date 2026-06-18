import mongoose from 'mongoose';

const stageeventSchema = new mongoose.Schema({
  eventId: { type: String, unique: true },
  batchId: { type: String, required: true },
  stageNo: Number,
  stageName: String,
  category: String,
  machineId: String,
  operatorId: String,
  shift: String,
  inTime: Date,
  outTime: Date,
  durationHrs: Number,
  inputQtyKg: Number,
  outputQtyKg: Number,
  delta: Number,
  rejectQtyKg: Number,
  rejectReason: String,
  recipeUsed: String,
  status: String
}, { timestamps: true });

const StageEvent = mongoose.model('StageEvent', stageeventSchema);
export default StageEvent;
