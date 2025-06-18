import express from 'express';
import { sendWelcomeEmail } from '../controllers/welcome.controller';
const router = express.Router();
router.post('/', sendWelcomeEmail);
export default router; 