import { Schema, model, models } from 'mongoose';

const AddressSchema = new Schema({
  label: { type: String, required: true }, // Home, Work, etc.
  street: { type: String, required: true },
  city: { type: String, required: true },
  coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
});

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  avatarUrl: { type: String, required: false },
  points: { type: Number, default: 0, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  savedAddresses: [AddressSchema]
}, { timestamps: true });

export const User = models['User'] || model('User', UserSchema);
