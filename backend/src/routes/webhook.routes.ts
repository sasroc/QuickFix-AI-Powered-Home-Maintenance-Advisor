import express from 'express';
import { handleWebhook } from '../controllers/stripe.controller';
const router = express.Router();
router.post('/', handleWebhook);
export default router; 