import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { logger } from './logger';

// Initialize Sentry
export const initSentry = () => {
  const dsn = process.env.SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';
  
  if (!dsn) {
    logger.warn('SENTRY_DSN not configured - error tracking disabled');
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment,
      
      // Performance Monitoring
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev
      
      // Profiling
      profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
      integrations: [
        nodeProfilingIntegration(),
      ],

      // Release tracking
      release: process.env.SENTRY_RELEASE || `quickfix-backend@${process.env.npm_package_version || '1.0.0'}`,

      // Error filtering
      beforeSend(event) {
        // Don't send certain errors to reduce noise
        if (event.exception) {
          const error = event.exception.values?.[0];
          if (error?.type === 'ValidationError' || 
              error?.value?.includes('Rate limit exceeded') ||
              error?.value?.includes('Unauthorized')) {
            return null; // Don't send these common errors
          }
        }
        return event;
      },

      // Additional context
      initialScope: {
        tags: {
          component: 'backend',
          service: 'quickfix-api'
        }
      }
    });

    logger.info('Sentry initialized successfully', { 
      environment,
      release: process.env.SENTRY_RELEASE || `quickfix-backend@${process.env.npm_package_version || '1.0.0'}`
    });
  } catch (error) {
    logger.error('Failed to initialize Sentry:', error);
  }
};

// Helper function to capture exceptions with context
export const captureException = (error: Error, context?: Record<string, any>) => {
  Sentry.withScope((scope) => {
    if (context) {
      Object.keys(context).forEach(key => {
        scope.setExtra(key, context[key]);
      });
    }
    Sentry.captureException(error);
  });
};

// Helper function to capture messages
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>) => {
  Sentry.withScope((scope) => {
    if (context) {
      Object.keys(context).forEach(key => {
        scope.setExtra(key, context[key]);
      });
    }
    scope.setLevel(level);
    Sentry.captureMessage(message);
  });
};

// Helper function to set user context
export const setUserContext = (user: { id: string; email?: string; plan?: string }) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.email,
    plan: user.plan
  });
};

// Helper function to add breadcrumbs
export const addBreadcrumb = (message: string, category: string, data?: Record<string, any>) => {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
    timestamp: Date.now() / 1000
  });
};

// Performance monitoring helpers
export const startTransaction = (name: string, op: string) => {
  return Sentry.startSpan({ name, op }, (span) => span);
};

export default Sentry; 