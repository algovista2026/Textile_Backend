import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  clientId: { type: String, unique: true }, name: String, type: String
}, { timestamps: true });

const Client = mongoose.model('Client', clientSchema);
export default Client;
