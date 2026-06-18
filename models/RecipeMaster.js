import mongoose from 'mongoose';

const recipeSchema = new mongoose.Schema({
  recipeName: { type: String, required: true },
  processType: { type: String, required: true },
  material: { type: mongoose.Schema.Types.ObjectId, ref: 'Chemical', required: true },
  standardQty: { type: Number, required: true },
  perMeter: { type: Number, required: true },
  unit: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('RecipeMaster', recipeSchema);
