import { Schema, model, models } from 'mongoose';

const ErrorLogSchema = new Schema({
  message: { type: String, required: true },
  stack: { type: String },
  url: { type: String },
  method: { type: String },
  userAgent: { type: String },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  source: { 
    type: String, 
    enum: ['client', 'server'], 
    default: 'server',
    required: true 
  },
  ip: { type: String },
  metadata: { type: Map, of: Schema.Types.Mixed }
}, { timestamps: true });

export const ErrorLog = models['ErrorLog'] || model('ErrorLog', ErrorLogSchema);
