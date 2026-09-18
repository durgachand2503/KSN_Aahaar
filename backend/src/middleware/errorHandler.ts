import { Request, Response, NextFunction } from 'express';
import { Error as MongooseError } from 'mongoose';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

export function errorHandler(
  err: AppError | Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Log full error in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error:', {
      message: err.message,
      statusCode: 'statusCode' in err ? err.statusCode : 500,
      stack: err.stack,
    });
  } else {
    // In production, only log non-operational (unexpected) errors
    if (!('isOperational' in err) || !err.isOperational) {
      console.error('Unexpected error:', err.message);
    }
  }

  // ── Map Mongoose errors to user-friendly 400 responses ──
  if (err instanceof MongooseError.ValidationError) {
    const messages = Object.values(err.errors).map((e) => e.message).join(', ');
    res.status(400).json({ success: false, error: `Validation failed: ${messages}` });
    return;
  }
  if (err instanceof MongooseError.CastError) {
    res.status(400).json({ success: false, error: `Invalid value for field: ${err.path}` });
    return;
  }

  const statusCode = 'statusCode' in err ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
    // Never expose stack traces in production
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}
