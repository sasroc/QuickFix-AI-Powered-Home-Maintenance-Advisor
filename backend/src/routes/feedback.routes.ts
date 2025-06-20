import express from 'express';
import { submitFeedback, getFeedback, updateFeedbackStatus, deleteFeedback } from '../controllers/feedback.controller';
import upload from '../middleware/multer';
import decodeToken from '../middleware/decodeToken';
import checkAdmin from '../middleware/checkAdmin';

const router = express.Router();

// Public route for submitting feedback
router.post('/submit', upload.array('screenshots', 5), submitFeedback);

// Protected admin routes
router.get('/', decodeToken, checkAdmin, getFeedback);
router.patch('/:feedbackId/status', decodeToken, checkAdmin, updateFeedbackStatus);
router.delete('/:feedbackId', decodeToken, checkAdmin, deleteFeedback);

export default router; 