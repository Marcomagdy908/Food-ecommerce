import { Request, Response } from 'express';
import { ErrorLog } from '../models/error-log.model';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

/**
 * Controller endpoint to log client-side errors in MongoDB.
 */
export async function logClientError(req: Request, res: Response): Promise<void> {
  try {
    const { message, stack, url } = req.body;
    const authReq = req as AuthenticatedRequest;

    if (!message) {
      res.status(400).json({ message: 'Error message is required' });
      return;
    }

    const errorLog = new ErrorLog({
      message,
      stack,
      url: url || req.headers.referer,
      userAgent: req.headers['user-agent'],
      userId: authReq.user ? authReq.user.id : undefined,
      source: 'client',
      ip: req.ip || req.socket.remoteAddress
    });

    const saved = await errorLog.save();
    res.status(201).json({ success: true, logId: saved._id });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to save client error log', error: error.message });
  }
}

/**
 * Admin endpoint to list recorded errors.
 */
export async function getErrorLogs(req: Request, res: Response): Promise<void> {
  try {
    const logs = await ErrorLog.find().sort({ createdAt: -1 }).limit(100);
    res.status(200).json(logs);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to retrieve error logs', error: error.message });
  }
}
