import { Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';
import { setUserContext, addBreadcrumb } from '../utils/sentry';

// Interface for requests with user data
interface RequestWithUser extends Request {
  user?: {
    uid: string;
    email?: string;
    plan?: string;
    [key: string]: any;
  };
}

// Middleware to set user context for Sentry
export const sentryUserContext = (req: RequestWithUser, res: Response, next: NextFunction) => {
  if (req.user) {
    setUserContext({
      id: req.user.uid,
      email: req.user.email,
      plan: req.user.plan
    });
  }
  next();
};

// Middleware to add request breadcrumbs
export const sentryRequestBreadcrumb = (req: Request, res: Response, next: NextFunction) => {
  addBreadcrumb(
    `${req.method} ${req.path}`,
    'http',
    {
      method: req.method,
      url: req.url,
      path: req.path,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    }
  );
  next();
};

// Performance monitoring middleware
export const sentryPerformanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Simplified performance tracking - Sentry will automatically track HTTP requests
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    if (duration > 1000) { // Only log slow requests
      Sentry.addBreadcrumb({
        message: `Slow request: ${req.method} ${req.path}`,
        category: 'performance',
        data: {
          method: req.method,
          path: req.path,
          duration,
          statusCode: res.statusCode
        },
        level: 'warning'
      });
    }
  });

  next();
};

// Error handling middleware for Sentry
export const sentryErrorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  // Add request context to error
  Sentry.withScope((scope) => {
    scope.setTag('path', req.path);
    scope.setTag('method', req.method);
    scope.setContext('request', {
      method: req.method,
      url: req.url,
      path: req.path,
      query: req.query,
      body: req.body ? JSON.stringify(req.body).substring(0, 1000) : undefined, // Limit body size
      headers: {
        'user-agent': req.get('User-Agent'),
        'content-type': req.get('Content-Type'),
        'authorization': req.get('Authorization') ? '[REDACTED]' : undefined
      }
    });

    // Set user context if available
    const reqWithUser = req as RequestWithUser;
    if (reqWithUser.user) {
      scope.setUser({
        id: reqWithUser.user.uid,
        email: reqWithUser.user.email,
        plan: reqWithUser.user.plan
      });
    }

    Sentry.captureException(error);
  });

  // Continue to next error handler
  next(error);
}; 