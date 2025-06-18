import { Request, Response } from 'express';
import EmailService from '../services/email.service';

export const sendSupportEmail = async (req: Request, res: Response) => {
  try {
    const { email, subject, message } = req.body;

    if (!email || !subject || !message) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const emailService = EmailService.getInstance();
    await emailService.sendSupportEmail(email, subject, message);

    res.json({ message: 'Support email sent successfully' });
  } catch (error) {
    console.error('Error sending support email:', error);
    res.status(500).json({ message: 'Failed to send support email' });
  }
}; 