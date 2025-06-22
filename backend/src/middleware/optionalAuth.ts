import { Request, Response, NextFunction } from 'express';
import admin from '../utils/firebaseAdmin';

interface RequestWithUser extends Request {
  user?: admin.auth.DecodedIdToken;
}

const optionalAuth = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    // No token provided, continue without user info
    req.user = undefined;
    return next();
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying token (optional auth):', error);
    // Token is invalid, but we continue without user info for optional auth
    req.user = undefined;
    next();
  }
};

export default optionalAuth; 