import mongoose from 'mongoose';

const fabricSchema = new mongoose.Schema({
  fabricId: { type: String, unique: true },
  fabricName: String,
  type: String,
  gsm: Number,
  widthInches: Number,
  construction: String
}, { timestamps: true });

const Fabric = mongoose.model('Fabric', fabricSchema);
export default Fabric;
