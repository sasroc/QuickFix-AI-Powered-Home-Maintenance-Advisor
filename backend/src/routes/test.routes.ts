import { Router, Request, Response } from 'express';
import { captureException, captureMessage } from '../utils/sentry';
import { logger } from '../utils/logger';

const router = Router();

// Test endpoint for Sentry error tracking
router.post('/sentry-error', (req: Request, res: Response) => {
  try {
    // Intentionally throw an error for testing
    throw new Error('Test error for Sentry - this is intentional for monitoring validation');
  } catch (error) {
    logger.error('Test error thrown for Sentry validation');
    captureException(error as Error, {
      testContext: 'sentry-validation',
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
    
    res.status(500).json({
      message: 'Test error thrown and captured by Sentry',
      timestamp: new Date().toISOString()
    });
  }
});

// Test endpoint for Sentry message capture
router.post('/sentry-message', (req: Request, res: Response) => {
  const { level = 'info', message = 'Test message for Sentry' } = req.body;
  
  captureMessage(message, level as any, {
    testContext: 'message-validation',
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  
  logger.info('Test message sent to Sentry', { level, message });
  
  res.json({
    message: 'Test message sent to Sentry',
    level,
    content: message,
    timestamp: new Date().toISOString()
  });
});

// Test endpoint for performance monitoring
router.get('/performance-test', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  // Simulate some work
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  logger.info('Performance test completed', { duration });
  
  res.json({
    message: 'Performance test completed',
    duration,
    timestamp: new Date().toISOString()
  });
});

// Test endpoint for load testing
router.get('/load-test', (req: Request, res: Response) => {
  const { delay = 0 } = req.query;
  const delayMs = parseInt(delay as string) || 0;
  
  setTimeout(() => {
    res.json({
      message: 'Load test response',
      delay: delayMs,
      timestamp: new Date().toISOString(),
      pid: process.pid,
      memory: process.memoryUsage()
    });
  }, delayMs);
});

export default router; 