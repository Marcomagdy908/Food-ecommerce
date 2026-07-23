import express from 'express';
import mongoose from 'mongoose';
import dns from 'dns';
import apiRouter from '../src/server/routes/api.routes';

// Set public DNS fallback for MongoDB Atlas SRV lookups on serverless
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore if DNS override is not permitted
}

const app = express();
app.use(express.json({ limit: '5mb' }));

const MONGODB_URI = process.env['MONGODB_URI'] || 'mongodb://127.0.0.1:27017/slicecraft';

async function ensureDBConnection() {
  if (mongoose.connection.readyState >= 1) return;
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully on Vercel Serverless Function.');
  } catch (err) {
    console.error('MongoDB Atlas connection error:', err);
  }
}

// Middleware to ensure DB connection per request
app.use(async (req, res, next) => {
  await ensureDBConnection();
  next();
});

// Mount API routes
app.use('/api/v1', apiRouter);

export default app;
