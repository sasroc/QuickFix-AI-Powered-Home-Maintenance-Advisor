import express from 'express';
import { createCheckoutSession } from '../controllers/stripe.controller';
import { generalRateLimit } from '../middleware/rateLimiter';

const router = express.Router();

// Subscription creation with general rate limiting
router.post('/', generalRateLimit, createCheckoutSession);
export default router; 