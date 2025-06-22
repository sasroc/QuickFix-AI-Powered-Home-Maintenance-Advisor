import { Router } from 'express';
import { analyzeIssue } from '../controllers/ai.controller';
import { aiRateLimit } from '../middleware/rateLimiter';
import optionalAuth from '../middleware/optionalAuth';

const router = Router();

// Route for analyzing maintenance issues - with strict rate limiting
// Uses optional auth so both authenticated and anonymous users can use it
router.post('/analyze', optionalAuth, aiRateLimit, analyzeIssue);

export default router; 