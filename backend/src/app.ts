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
import stripeRoutes from './routes/stripe.routes';

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
// Stripe webhook raw body parser
app.use('/api/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '50mb' }));

// Routes
app.use('/api/ai', aiRoutes);
app.use('/api', stripeRoutes);

// Error handling
app.use(errorHandler);

// Start server
app.listen(port, '0.0.0.0', () => {
  logger.info(`Server is running on port ${port} and is accessible from other devices`);
}); 