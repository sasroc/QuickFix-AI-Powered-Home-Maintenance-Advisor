import { Request, Response } from 'express';
import EmailService from '../services/email.service';

export const sendWelcomeEmail = async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Missing email' });
    }
    await EmailService.getInstance().sendWelcomeEmail(email, name || email.split('@')[0]);
    res.json({ message: 'Welcome email sent successfully' });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    res.status(500).json({ message: 'Failed to send welcome email' });
  }
}; 