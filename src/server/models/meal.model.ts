import { Schema, model, models } from 'mongoose';

const MealSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: { type: String, required: true, index: true },
  imageUrl: { type: String },
  tags: [{ type: String }],
  isAvailable: { type: Boolean, default: true }
}, { timestamps: true });

export const Meal = models['Meal'] || model('Meal', MealSchema);
export default Meal;
