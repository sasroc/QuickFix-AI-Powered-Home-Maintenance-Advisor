import winston from 'winston';

// Create logger with different configurations for development and production
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    process.env.NODE_ENV === 'production'
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
  ),
  defaultMeta: { service: 'quickfix-backend' },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// If we're not in production then log to the `console` with the format:
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
} else {
  // In production, also log to console but with JSON format for Railway
  logger.add(new winston.transports.Console({
    format: winston.format.json()
  }));
}

export { logger }; 