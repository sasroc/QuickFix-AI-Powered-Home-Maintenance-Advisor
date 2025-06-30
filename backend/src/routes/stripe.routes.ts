import { Router } from 'express';
import { createCheckoutSession, handleWebhook, createPortalSession, processRefund, getRefundEligibility } from '../controllers/stripe.controller';
import { generalRateLimit, webhookRateLimit } from '../middleware/rateLimiter';
import decodeToken from '../middleware/decodeToken';

const router = Router();

// Stripe subscription endpoints with general rate limiting
router.post('/subscribe', generalRateLimit, createCheckoutSession);
router.post('/start-trial', generalRateLimit, createCheckoutSession);
router.post('/webhook', webhookRateLimit, handleWebhook);
router.post('/create-portal-session', generalRateLimit, decodeToken, createPortalSession);

// Refund endpoints
router.post('/refund', generalRateLimit, decodeToken, processRefund);
router.get('/refund-eligibility/:uid', generalRateLimit, decodeToken, getRefundEligibility);

export default router; 