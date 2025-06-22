import * as Sentry from '@sentry/react';

// Initialize Sentry for React
export const initSentry = () => {
  const dsn = process.env.REACT_APP_SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';
  
  if (!dsn) {
    console.warn('REACT_APP_SENTRY_DSN not configured - error tracking disabled');
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment,
      
      // Performance Monitoring
      integrations: [
        Sentry.browserTracingIntegration(),
      ],
      
      // Performance sampling
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
      
      // Release tracking
      release: process.env.REACT_APP_SENTRY_RELEASE || `quickfix-frontend@${process.env.REACT_APP_VERSION || '1.0.0'}`,
      
      // Error filtering
      beforeSend(event) {
        // Don't send certain errors to reduce noise
        if (event.exception) {
          const error = event.exception.values?.[0];
          if (error?.value?.includes('Non-Error promise rejection') ||
              error?.value?.includes('ResizeObserver loop limit exceeded') ||
              error?.value?.includes('Network Error')) {
            return null; // Don't send these common errors
          }
        }
        return event;
      },

      // Additional context
      initialScope: {
        tags: {
          component: 'frontend',
          service: 'quickfix-ui'
        }
      }
    });

    console.log('Sentry initialized successfully', { environment });
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
  }
};

// Helper function to capture exceptions with context
export const captureException = (error, context) => {
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
export const captureMessage = (message, level = 'info', context) => {
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
export const setUserContext = (user) => {
  if (user === null) {
    // Clear user context on logout
    Sentry.setUser(null);
    return;
  }
  
  Sentry.setUser({
    id: user.uid,
    email: user.email,
    username: user.displayName || user.email,
    plan: user.plan
  });
};

// Helper function to add breadcrumbs
export const addBreadcrumb = (message, category, data) => {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
    timestamp: Date.now() / 1000
  });
};

// Performance monitoring helpers
export const startTransaction = (name, op) => {
  return Sentry.startSpan({ name, op }, (span) => span);
};

export default Sentry; 