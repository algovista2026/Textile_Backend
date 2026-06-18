import mongoose from 'mongoose';

const recipeSchema = new mongoose.Schema({
  recipeId: { type: String, unique: true }, designId: String, chemicals: [{ chemicalId: String, quantity: Number }]
}, { timestamps: true });

const Recipe = mongoose.model('Recipe', recipeSchema);
export default Recipe;
