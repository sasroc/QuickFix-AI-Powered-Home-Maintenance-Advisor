import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Type for authenticated request with user info
interface RequestWithUser extends Request {
  user?: {
    uid: string;
    email?: string;
    [key: string]: any;
  };
}

// Custom key generator that considers both IP and user ID for authenticated requests
const createKeyGenerator = (prefix: string) => {
  return (req: Request): string => {
    const userReq = req as RequestWithUser;
    const userId = userReq.user?.uid || 'anonymous';
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return `${prefix}:${userId}:${ip}`;
  };
};

// Custom error handler for rate limit responses
const rateLimitHandler = (req: Request, res: Response) => {
  // Get retry after from rate limit headers or default to 15 minutes
  const retryAfter = Math.round(Date.now() / 1000) + 900; // 15 minutes from now

  res.status(429).json({
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.',
    retryAfter
  });
};

// AI Analysis Rate Limiter - Most restrictive (expensive OpenAI calls)
export const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req: Request) => {
    // Authenticated users get more requests
    const userReq = req as RequestWithUser;
    return userReq.user ? 20 : 5; // 20 requests per 15 min for auth users, 5 for anonymous
  },
  message: {
    error: 'AI analysis rate limit exceeded',
    message: 'Too many AI analysis requests. Please wait before making more requests.',
    suggestion: 'Consider upgrading your plan for higher limits.'
  },
  keyGenerator: createKeyGenerator('ai'),
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests in count (only count failed/error requests)
  skipSuccessfulRequests: false,
  // Skip failed requests (don't penalize server errors)
  skipFailedRequests: true
});

// Feedback Submission Rate Limiter - Prevent spam
export const feedbackRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 feedback submissions per hour
  message: {
    error: 'Feedback submission rate limit exceeded',
    message: 'Too many feedback submissions. Please wait before submitting more feedback.'
  },
  keyGenerator: createKeyGenerator('feedback'),
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false
});

// General API Rate Limiter - For most endpoints
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req: Request) => {
    // Higher limits for authenticated users
    const userReq = req as RequestWithUser;
    return userReq.user ? 1000 : 100; // 1000 requests per 15 min for auth users, 100 for anonymous
  },
  message: {
    error: 'API rate limit exceeded',
    message: 'Too many requests. Please slow down.'
  },
  keyGenerator: createKeyGenerator('general'),
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false
});

// Admin Route Rate Limiter - For admin operations
export const adminRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // 100 admin requests per 5 minutes
  message: {
    error: 'Admin rate limit exceeded',
    message: 'Too many admin requests. Please wait before continuing.'
  },
  keyGenerator: createKeyGenerator('admin'),
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false
});

// Stripe Webhook Rate Limiter - Special handling for webhooks
export const webhookRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // 50 webhook calls per minute (Stripe can send many)
  message: {
    error: 'Webhook rate limit exceeded',
    message: 'Too many webhook requests.'
  },
  keyGenerator: (req: Request) => {
    // Use IP only for webhooks since they don't have user context
    return `webhook:${req.ip || 'unknown'}`;
  },
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false
});

// Authentication Rate Limiter - For login/signup attempts
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 authentication attempts per 15 minutes
  message: {
    error: 'Authentication rate limit exceeded',
    message: 'Too many authentication attempts. Please wait before trying again.',
    suggestion: 'Use password reset if you forgot your credentials.'
  },
  keyGenerator: (req: Request) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const email = req.body?.email || 'no-email';
    return `auth:${email}:${ip}`;
  },
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false
});

// Global Rate Limiter - Last resort protection
export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // 2000 requests per 15 minutes per IP
  message: {
    error: 'Global rate limit exceeded',
    message: 'Too many requests from this IP. Please slow down significantly.'
  },
  keyGenerator: (req: Request) => {
    return `global:${req.ip || 'unknown'}`;
  },
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false
});

export default {
  aiRateLimit,
  feedbackRateLimit,
  generalRateLimit,
  adminRateLimit,
  webhookRateLimit,
  authRateLimit,
  globalRateLimit
}; 