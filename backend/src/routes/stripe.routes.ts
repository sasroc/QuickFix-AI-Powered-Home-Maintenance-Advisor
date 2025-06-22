import { Router } from 'express';
import { createCheckoutSession, handleWebhook, createPortalSession } from '../controllers/stripe.controller';
import { generalRateLimit, webhookRateLimit } from '../middleware/rateLimiter';
import decodeToken from '../middleware/decodeToken';

const router = Router();

// Stripe subscription endpoints with general rate limiting
router.post('/subscribe', generalRateLimit, createCheckoutSession);
router.post('/webhook', webhookRateLimit, handleWebhook);
router.post('/create-portal-session', generalRateLimit, decodeToken, createPortalSession);

export default router; 