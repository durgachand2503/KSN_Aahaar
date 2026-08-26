import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from './errorHandler';
import User from '../models/User';
import Admin from '../models/Admin';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; role: 'customer' | 'admin' };
    }
  }
}

/**
 * Verify JWT and attach user to request
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const token =
      req.cookies?.token ||
      req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new AppError('Authentication required. Please log in.', 401);
    }

    const decoded = jwt.verify(token, config.jwtSecret) as {
      id: string;
      email: string;
      role: 'customer' | 'admin';
    };

    // Verify user still exists
    if (decoded.role === 'admin') {
      const admin = await Admin.findById(decoded.id).select('-password');
      if (!admin) throw new AppError('Admin not found.', 401);
    } else {
      const user = await User.findById(decoded.id).select('-password');
      if (!user) throw new AppError('User not found.', 401);
    }

    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Invalid or expired token.', 401));
    }
    next(error);
  }
}

/**
 * Require admin role
 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return next(new AppError('Admin access required.', 403));
  }
  next();
}

/**
 * Optional auth — attaches user if token exists, but doesn't require it
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token =
      req.cookies?.token ||
      req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, config.jwtSecret) as {
        id: string;
        email: string;
        role: 'customer' | 'admin';
      };
      req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    }
  } catch {
    // Token invalid, continue without auth
  }
  next();
}

/**
 * Generate JWT token
 */
export function generateToken(payload: { id: string; email: string; role: 'customer' | 'admin' }): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions);
}
