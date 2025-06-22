import express from 'express';
import { handleWebhook } from '../controllers/stripe.controller';
import { webhookRateLimit } from '../middleware/rateLimiter';

const router = express.Router();

// Webhook endpoint with specialized rate limiting for Stripe webhooks
router.post('/', webhookRateLimit, handleWebhook);
export default router; 