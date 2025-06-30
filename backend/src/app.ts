import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables first, before any other imports
// In production/Railway, environment variables are provided directly
// Only try to load .env file if it exists and we're likely in development
const envPath = path.resolve(__dirname, '../.env');
const isProduction = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT;
const envFileExists = fs.existsSync(envPath);

if (!isProduction && envFileExists) {
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env file:', result.error);
  } else {
    console.log('Loaded environment variables from .env file');
  }
} else {
  console.log('Using environment variables from system (production mode)');
}

// Initialize Sentry as early as possible
import { initSentry } from './utils/sentry';
initSentry();

// Now import other modules
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { globalRateLimit } from './middleware/rateLimiter';
import { sentryRequestBreadcrumb, sentryPerformanceMiddleware, sentryErrorHandler } from './middleware/sentryMiddleware';
import aiRoutes from './routes/ai.routes';
import stripeRoutes from './routes/stripe.routes';
import supportRoutes from './routes/support.routes';
import subscribeRoutes from './routes/subscribe.routes';
import welcomeRoutes from './routes/welcome.routes';
import feedbackRoutes from './routes/feedback.routes';
import cacheRoutes from './routes/cache.routes';
import testRoutes from './routes/test.routes';
import adminRoutes from './routes/admin.routes';

const app = express();
const port = parseInt(process.env.PORT || '4000', 10);

// Determine allowed origins based on environment
const getAllowedOrigins = () => {
  const origins = [];
  
  // Always allow localhost for development and testing
  origins.push('http://localhost:3000', 'http://127.0.0.1:3000');
  
  // Also allow the production frontend URL if specified
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL);
  }
  
  // In development, be more permissive
  if (process.env.NODE_ENV !== 'production') {
    origins.push('*');
  }
  
  return origins;
};

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: getAllowedOrigins(),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Sentry middleware (before routes but after basic middleware)
app.use(sentryRequestBreadcrumb);
app.use(sentryPerformanceMiddleware);

// Global rate limiting - applies to all routes
app.use(globalRateLimit);

// Stripe webhook raw body parser - MUST come before JSON parser
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

// JSON body parser - skip for routes that handle multipart form data or need raw body
app.use((req, res, next) => {
  // Skip JSON parsing for feedback submit route (uses multer for multipart form data)
  if (req.path === '/api/feedback/submit') {
    return next();
  }
  // Skip JSON parsing for Stripe webhook (needs raw body)
  if (req.path === '/api/stripe/webhook') {
    return next();
  }
  // Apply JSON parsing for all other routes
  express.json({ limit: '50mb' })(req, res, next);
});

// Health check endpoint for uptime monitoring
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes
app.use('/api/ai', aiRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/subscribe', subscribeRoutes);
app.use('/api/welcome', welcomeRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/cache', cacheRoutes);
app.use('/api/test', testRoutes);
app.use('/api/admin', adminRoutes);

// Error handling (Sentry error handler must come before other error handlers)
app.use(sentryErrorHandler);
app.use(errorHandler);

// Start server
const server = app.listen(port, '0.0.0.0', () => {
  logger.info(`Server is running on port ${port} and is accessible from other devices`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
}); 