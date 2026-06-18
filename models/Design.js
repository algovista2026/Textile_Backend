import mongoose from 'mongoose';

const designSchema = new mongoose.Schema({
  designId: { type: String, unique: true },
  designName: String,
  printType: String,
  noOfColours: Number,
  bleachLevelRequired: String,
  repeatSizeCm: Number,
  status: String
}, { timestamps: true });

const Design = mongoose.model('Design', designSchema);
export default Design;
