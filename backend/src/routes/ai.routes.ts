import { Router } from 'express';
import { analyzeIssue } from '../controllers/ai.controller';

const router = Router();

// Route for analyzing maintenance issues
router.post('/analyze', analyzeIssue);

export default router; 