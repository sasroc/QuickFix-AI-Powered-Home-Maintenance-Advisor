import express from 'express';
import { sendWelcomeEmail } from '../controllers/welcome.controller';
import { generalRateLimit } from '../middleware/rateLimiter';

const router = express.Router();

// Welcome email endpoint with general rate limiting
router.post('/', generalRateLimit, sendWelcomeEmail);
export default router; 