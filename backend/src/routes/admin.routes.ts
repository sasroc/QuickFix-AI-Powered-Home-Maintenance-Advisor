import { Router } from 'express';
import { cleanupExpiredTrialGracePeriods, checkAndUpdateUserTrialStatus } from '../utils/trialCleanup';
import { generalRateLimit } from '../middleware/rateLimiter';
import decodeToken from '../middleware/decodeToken';
import checkAdmin from '../middleware/checkAdmin';

const router = Router();

// Admin endpoint to manually trigger trial cleanup
router.post('/cleanup-expired-trials', generalRateLimit, decodeToken, checkAdmin, async (req, res) => {
  try {
    await cleanupExpiredTrialGracePeriods();
    res.json({ 
      success: true, 
      message: 'Trial cleanup completed successfully' 
    });
  } catch (error) {
    console.error('Trial cleanup error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to cleanup expired trials' 
    });
  }
});

// Admin endpoint to check specific user trial status
router.post('/check-user-trial/:uid', generalRateLimit, decodeToken, checkAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    const updated = await checkAndUpdateUserTrialStatus(uid);
    res.json({ 
      success: true, 
      updated,
      message: updated ? 'User trial status updated' : 'No update needed'
    });
  } catch (error) {
    console.error('User trial check error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to check user trial status' 
    });
  }
});

export default router; 