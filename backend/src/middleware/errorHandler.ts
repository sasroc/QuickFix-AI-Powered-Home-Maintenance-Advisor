import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { captureException } from '../utils/sentry';

export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    logger.error(`Operational Error: ${err.message}`);
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }

  // Programming or unknown errors - capture to Sentry
  logger.error(`Unexpected Error: ${err.message}`, {
    path: req.path,
    method: req.method,
    stack: err.stack
  });
  
  // Capture unexpected errors to Sentry
  captureException(err, {
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    userAgent: req.get('User-Agent')
  });

  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong'
  });
}; 