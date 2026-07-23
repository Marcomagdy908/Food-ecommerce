import express from 'express';
import mongoose from 'mongoose';
import dns from 'dns';
import apiRouter from '../src/server/routes/api.routes';

// Set public DNS fallback ONLY on Windows (local dev machine)
if (process.platform === 'win32') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (e) {
    // Ignore if DNS override is not permitted
  }
}

const app = express();
app.use(express.json({ limit: '5mb' }));

const MONGODB_URI = process.env['MONGODB_URI'] || 'mongodb://127.0.0.1:27017/slicecraft';

async function ensureDBConnection() {
  if (mongoose.connection.readyState >= 1) return;
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('MongoDB connected successfully on Vercel Serverless Function.');
  } catch (err) {
    console.error('MongoDB Atlas connection error:', err);
    throw err;
  }
}

// Middleware to ensure DB connection per request
app.use(async (req, res, next) => {
  try {
    await ensureDBConnection();
    next();
  } catch (err: any) {
    res.status(500).json({
      message: 'Database connection failed. Please ensure MONGODB_URI environment variable is configured in Vercel project settings and 0.0.0.0/0 is whitelisted in MongoDB Atlas Network Access.',
      error: err?.message || String(err)
    });
  }
});

// Mount API routes
app.use('/api/v1', apiRouter);

export default app;
