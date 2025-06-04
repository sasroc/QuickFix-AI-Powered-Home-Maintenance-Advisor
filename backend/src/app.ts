import dotenv from 'dotenv';
import path from 'path';

// Load environment variables first, before any other imports
const envPath = path.resolve(__dirname, '../.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env file:', result.error);
  process.exit(1);
}

// Now import other modules
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import aiRoutes from './routes/ai.routes';

// Log environment variables (excluding sensitive data)
console.log('Environment variables loaded:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  FRONTEND_URL: process.env.FRONTEND_URL,
  LOG_LEVEL: process.env.LOG_LEVEL,
  HUGGINGFACE_API_KEY_SET: !!process.env.HUGGINGFACE_API_KEY,
  HUGGINGFACE_API_KEY_PREFIX: process.env.HUGGINGFACE_API_KEY?.substring(0, 3) // Log first 3 chars to verify format
});

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
app.use(express.json({ limit: '50mb' }));

// Routes
app.use('/api/ai', aiRoutes);

// Error handling
app.use(errorHandler);

// Start server
app.listen(port, '0.0.0.0', () => {
  logger.info(`Server is running on port ${port} and is accessible from other devices`);
}); 