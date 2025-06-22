import dotenv from 'dotenv';
import path from 'path';

// Load environment variables first, before any other imports
const envPath = path.resolve(__dirname, '../.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env file:', result.error);
  process.exit(1);
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
import webhookRoutes from './routes/webhook.routes';
import welcomeRoutes from './routes/welcome.routes';
import feedbackRoutes from './routes/feedback.routes';
import cacheRoutes from './routes/cache.routes';
import testRoutes from './routes/test.routes';

const app = express();
const port = parseInt(process.env.PORT || '4000', 10);

// Middleware
app.use(helmet());
app.use(cors({
  origin: '*', // Allow all origins for development
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(morgan('dev'));

// Sentry middleware (before routes but after basic middleware)
app.use(sentryRequestBreadcrumb);
app.use(sentryPerformanceMiddleware);

// Global rate limiting - applies to all routes
app.use(globalRateLimit);
// Stripe webhook raw body parser
app.use('/api/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '50mb' }));

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
app.use('/api/webhook', express.raw({ type: 'application/json' }), webhookRoutes);
app.use('/api/welcome', welcomeRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/cache', cacheRoutes);
app.use('/api/test', testRoutes);

// Error handling (Sentry error handler must come before other error handlers)
app.use(sentryErrorHandler);
app.use(errorHandler);

// Start server
app.listen(port, '0.0.0.0', () => {
  logger.info(`Server is running on port ${port} and is accessible from other devices`);
}); 