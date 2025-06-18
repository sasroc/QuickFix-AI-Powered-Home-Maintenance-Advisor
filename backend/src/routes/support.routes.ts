import express from 'express';
import { sendSupportEmail } from '../controllers/support.controller';

const router = express.Router();

router.post('/contact', sendSupportEmail);

export default router; 