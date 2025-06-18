import express from 'express';
import { createCheckoutSession } from '../controllers/stripe.controller';
const router = express.Router();
router.post('/', createCheckoutSession);
export default router; 