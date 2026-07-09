import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

/**
 * Extracts cookie value by name from raw Cookie header.
 */
function getCookieValue(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.split('; ').find(row => row.startsWith(`${name}=`));
  return match ? match.split('=')[1] || null : null;
}

/**
 * Middleware to authenticate requests using cookie-based token.
 * Populates req.user if token is valid.
 */
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

/**
 * Guard middleware to reject unauthenticated requests.
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized. Please log in.' });
    return;
  }
  next();
}
