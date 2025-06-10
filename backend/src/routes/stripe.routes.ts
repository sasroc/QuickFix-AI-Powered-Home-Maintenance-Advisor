import { Router } from 'express';
import { createCheckoutSession, handleWebhook, createPortalSession } from '../controllers/stripe.controller';

const router = Router();

router.post('/subscribe', createCheckoutSession);
router.post('/webhook', handleWebhook);
router.post('/create-portal-session', createPortalSession);

export default router; 