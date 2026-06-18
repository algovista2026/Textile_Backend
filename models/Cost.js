import mongoose from 'mongoose';

const costSchema = new mongoose.Schema({
  costId: { type: String, unique: true }, type: String, value: Number
}, { timestamps: true });

const Cost = mongoose.model('Cost', costSchema);
export default Cost;
