import { Request, Response, NextFunction } from 'express';
import admin from '../utils/firebaseAdmin';

interface AuthenticatedRequest extends Request {
  user?: admin.auth.DecodedIdToken;
}

const checkAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).send('Unauthorized');
  }

  const { uid } = req.user;
  try {
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    if (userDoc.exists && userDoc.data()?.isAdmin) {
      return next();
    }
    return res.status(403).send('Forbidden: requires admin privileges');
  } catch (error) {
    console.error('Error checking admin status:', error);
    return res.status(500).send('Internal server error');
  }
};

export default checkAdmin; 