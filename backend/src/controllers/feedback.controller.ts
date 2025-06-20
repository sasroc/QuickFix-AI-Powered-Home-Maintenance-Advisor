import { Request, Response } from 'express';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import admin from '../utils/firebaseAdmin';
import EmailService from '../services/email.service';

interface Feedback {
  id: string;
  type: string;
  title: string;
  description: string;
  email: string;
  priority: string;
  category: string;
  userId: string;
  userAgent: string;
  url: string;
  timestamp: string;
  status: string;
  screenshots: string[];
  steps?: string;
  expected?: string;
  actual?: string;
  createdAt: any;
  updatedAt: any;
  response?: string;
  respondedAt?: any;
}

export const submitFeedback = async (req: Request, res: Response) => {
  try {
    const {
      type,
      title,
      description,
      email,
      priority,
      category,
      userId,
      userAgent,
      url,
      timestamp,
      steps,
      expected,
      actual
    } = req.body;

    // Validate required fields
    if (!type || !title || !description || !email) {
      throw new AppError('Missing required fields', 400);
    }

    // Validate feedback type
    const validTypes = ['bug', 'feature', 'general'];
    if (!validTypes.includes(type)) {
      throw new AppError('Invalid feedback type', 400);
    }

    // Process screenshots if any
    const screenshots: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        try {
          // Convert buffer to base64
          const base64 = file.buffer.toString('base64');
          const mimeType = file.mimetype;
          const dataUrl = `data:${mimeType};base64,${base64}`;
          screenshots.push(dataUrl);
        } catch (error) {
          logger.error('Error processing screenshot:', error);
        }
      }
    }

    // Create feedback document
    const feedbackData = {
      type,
      title,
      description,
      email,
      priority: priority || 'medium',
      category: category || '',
      userId: userId || 'anonymous',
      userAgent,
      url,
      timestamp: timestamp || new Date().toISOString(),
      status: 'new',
      screenshots,
      // Type-specific fields
      ...(type === 'bug' && {
        steps: steps || '',
        expected: expected || '',
        actual: actual || ''
      }),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Save to Firestore
    const feedbackRef = await admin.firestore().collection('feedback').add(feedbackData);
    
    logger.info('Feedback submitted successfully:', {
      feedbackId: feedbackRef.id,
      type,
      priority,
      hasScreenshots: screenshots.length > 0,
      userId
    });

    // Send email notification to support team
    try {
      const emailService = EmailService.getInstance();
      await emailService.sendFeedbackNotification(
        email,
        type,
        title,
        description,
        priority,
        screenshots.length
      );
    } catch (emailError) {
      logger.error('Failed to send feedback notification email:', emailError);
      // Don't fail the request if email fails
    }

    // Send confirmation email to user
    try {
      const emailService = EmailService.getInstance();
      await emailService.sendFeedbackConfirmation(email, type, title);
    } catch (emailError) {
      logger.error('Failed to send feedback confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedbackId: feedbackRef.id
    });

  } catch (error) {
    logger.error('Error submitting feedback:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const getFeedback = async (req: Request, res: Response) => {
  try {
    const { status, type, priority, limit = 50, offset = 0 } = req.query;

    let query: admin.firestore.Query = admin.firestore()
      .collection('feedback')
      .orderBy('createdAt', 'desc');

    // Fetch all documents and then filter in-memory
    // This avoids needing a composite index for every filter combination.
    const snapshot = await query.limit(Number(limit) * 5) // Fetch more to allow for filtering
      .offset(Number(offset)).get();

    let allFeedback: Feedback[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt
    } as Feedback));

    // Apply all filters in-memory
    let filteredFeedback = allFeedback;

    if (status) {
      filteredFeedback = filteredFeedback.filter(item => item.status === status);
    }
    if (type) {
      filteredFeedback = filteredFeedback.filter(item => item.type === type);
    }
    if (priority) {
      filteredFeedback = filteredFeedback.filter(item => item.priority === priority);
    }
    
    // Apply limit after filtering
    const finalFeedback = filteredFeedback.slice(0, Number(limit));

    res.json({
      feedback: finalFeedback,
      total: finalFeedback.length,
      hasMore: allFeedback.length > Number(limit)
    });

  } catch (error: unknown) {
    logger.error('Error fetching feedback:', error);
    if (error && typeof error === 'object' && 'code' in error) {
      const firebaseError = error as { code: number; details?: string };
      if (firebaseError.code === 9) { // FAILED_PRECONDITION for missing index
        return res.status(400).json({ 
          message: 'Query requires a composite index. Please create it in your Firebase console.',
          error: firebaseError.details 
        });
      }
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateFeedbackStatus = async (req: Request, res: Response) => {
  try {
    const { feedbackId } = req.params;
    const { status, response } = req.body;

    if (!status) {
      throw new AppError('Status is required', 400);
    }

    const validStatuses = ['new', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid status', 400);
    }

    const feedbackRef = admin.firestore().collection('feedback').doc(feedbackId);
    const feedbackDoc = await feedbackRef.get();

    if (!feedbackDoc.exists) {
      throw new AppError('Feedback not found', 404);
    }

    const updateData: any = {
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (response) {
      updateData.response = response;
      updateData.respondedAt = admin.firestore.FieldValue.serverTimestamp();
    }

    await feedbackRef.update(updateData);

    // Send email notification to user if status changed to resolved
    if (status === 'resolved' && feedbackDoc.data()?.email) {
      try {
        const emailService = EmailService.getInstance();
        await emailService.sendFeedbackResolution(
          feedbackDoc.data()!.email,
          feedbackDoc.data()!.title,
          response || ''
        );
      } catch (emailError) {
        logger.error('Failed to send feedback resolution email:', emailError);
      }
    }

    logger.info('Feedback status updated:', { feedbackId: feedbackId, status });

    res.json({
      message: 'Feedback status updated successfully',
      feedbackId: feedbackId,
      status
    });

  } catch (error) {
    logger.error('Error updating feedback status:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const deleteFeedback = async (req: Request, res: Response) => {
  try {
    const { feedbackId } = req.params;

    if (!feedbackId) {
      throw new AppError('Feedback ID is required', 400);
    }

    const feedbackRef = admin.firestore().collection('feedback').doc(feedbackId);
    const doc = await feedbackRef.get();

    if (!doc.exists) {
      throw new AppError('Feedback not found', 404);
    }

    await feedbackRef.delete();

    logger.info('Feedback deleted successfully:', { feedbackId });

    res.status(200).json({ message: 'Feedback deleted successfully' });

  } catch (error: unknown) {
    logger.error('Error deleting feedback:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}; 