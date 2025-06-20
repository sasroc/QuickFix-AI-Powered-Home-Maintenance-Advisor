import { Request, Response, NextFunction } from 'express';
import admin from '../utils/firebaseAdmin';

interface AuthenticatedRequest extends Request {
  user?: admin.auth.DecodedIdToken;
}

const decodeToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).send('Unauthorized: No token provided');
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(403).send('Forbidden: Invalid token');
  }
};

export default decodeToken; 