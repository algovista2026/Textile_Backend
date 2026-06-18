import mongoose from 'mongoose';

const operatorSchema = new mongoose.Schema({
  operatorId: { type: String, unique: true }, name: String, role: String
}, { timestamps: true });

const Operator = mongoose.model('Operator', operatorSchema);
export default Operator;
