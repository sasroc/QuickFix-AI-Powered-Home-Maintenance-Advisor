import { Router } from 'express';
import { createCheckoutSession, handleWebhook } from '../controllers/stripe.controller';

const router = Router();

router.post('/subscribe', createCheckoutSession);
router.post('/webhook', handleWebhook);

export default router; 