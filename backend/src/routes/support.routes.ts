import express from 'express';
import { sendSupportEmail } from '../controllers/support.controller';
import { feedbackRateLimit } from '../middleware/rateLimiter';

const router = express.Router();

// Support contact form with same rate limiting as feedback to prevent spam
router.post('/contact', feedbackRateLimit, sendSupportEmail);

export default router; 