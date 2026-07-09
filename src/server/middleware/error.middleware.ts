import { Request, Response, NextFunction } from 'express';
import { ErrorLog } from '../models/error-log.model';
import { AuthenticatedRequest } from './auth.middleware';

/**
 * Express global error handling middleware.
 * Intercepts unhandled errors, saves them to MongoDB, and returns a clean response.
 */
export async function globalErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    
    // Create database log
    const errorLog = new ErrorLog({
      message: err.message || 'Unknown Server Error',
      stack: err.stack,
      url: req.originalUrl || req.url,
      method: req.method,
      userAgent: req.headers['user-agent'],
      userId: authReq.user ? authReq.user.id : undefined,
      source: 'server',
      ip: req.ip || req.socket.remoteAddress
    });

    await errorLog.save();
    console.error(`[Error Logged to DB]: ${err.message}`);
  } catch (logError) {
    // Fallback if logging to database fails
    console.error('Failed to log error to database:', logError);
    console.error('Original error:', err);
  }

  // Send server error response
  res.status(res.statusCode === 200 ? 500 : res.statusCode).json({
    message: err.message || 'An unexpected server error occurred.',
    error: process.env['NODE_ENV'] === 'production' ? {} : err.stack
  });
}
