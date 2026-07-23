import 'dotenv/config';
import dns from 'dns';
import mongoose from 'mongoose';

if (process.platform === 'win32') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (e) {
    // Ignore DNS override errors if in restricted environment
  }
}

const MONGODB_URI = process.env['MONGODB_URI'] || 'mongodb://127.0.0.1:27017/slicecraft';

export async function connectDB(): Promise<void> {
  if (mongoose.connection.readyState >= 1) return;

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully to SliceCraft database.');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Do not crash the entire server immediately to allow client render offline/fallback
  }
}
