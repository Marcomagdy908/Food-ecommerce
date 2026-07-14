import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

function getCookieValue(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.split('; ').find(row => row.startsWith(`${name}=`));
  return match ? match.split('=')[1] || null : null;
}


export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = getCookieValue(req.headers.cookie, 'token');

  if (!token) {
    next();
    return;
  }

  const payload = verifyToken(token);
  if (payload) {
    req.user = {
      id: payload.id,
      email: payload.email,
      name: payload.name
    };
  }

  next();
}

import { User } from '../models/user.model';


export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized. Please log in.' });
    return;
  }
  next();
}


export async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized. Please log in.' });
    return;
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      res.status(403).json({ message: 'Forbidden. Admin privileges required.' });
      return;
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server authorization check failed' });
  }
}
