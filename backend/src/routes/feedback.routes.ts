import express from 'express';
import { submitFeedback, getFeedback, updateFeedbackStatus, deleteFeedback } from '../controllers/feedback.controller';
import upload from '../middleware/multer';
import decodeToken from '../middleware/decodeToken';
import checkAdmin from '../middleware/checkAdmin';
import { feedbackRateLimit, adminRateLimit } from '../middleware/rateLimiter';

const router = express.Router();

// Public route for submitting feedback - with rate limiting to prevent spam
router.post('/submit', feedbackRateLimit, upload.array('screenshots', 5), submitFeedback);

// Protected admin routes - with admin-specific rate limiting
router.get('/', adminRateLimit, decodeToken, checkAdmin, getFeedback);
router.patch('/:feedbackId/status', adminRateLimit, decodeToken, checkAdmin, updateFeedbackStatus);
router.delete('/:feedbackId', adminRateLimit, decodeToken, checkAdmin, deleteFeedback);

export default router; 