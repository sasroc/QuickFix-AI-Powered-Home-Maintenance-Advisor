import { Router } from 'express';
import cacheService from '../services/cacheService';
import { adminRateLimit } from '../middleware/rateLimiter';
import decodeToken from '../middleware/decodeToken';
import checkAdmin from '../middleware/checkAdmin';

const router = Router();

// Get cache statistics - admin only
router.get('/stats', adminRateLimit, decodeToken, checkAdmin, (req, res) => {
  try {
    const stats = cacheService.getStats();
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get cache statistics'
    });
  }
});

// Clear all cache - admin only (use with extreme caution)
router.delete('/clear', adminRateLimit, decodeToken, checkAdmin, (req, res) => {
  try {
    cacheService.clearAll();
    res.json({
      success: true,
      message: 'All cache entries cleared'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache'
    });
  }
});

// Invalidate user cache - admin only
router.delete('/user/:uid', adminRateLimit, decodeToken, checkAdmin, (req, res) => {
  try {
    const { uid } = req.params;
    cacheService.invalidateUserData(uid);
    res.json({
      success: true,
      message: `Cache invalidated for user: ${uid}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to invalidate user cache'
    });
  }
});

// Invalidate AI responses - admin only
router.delete('/ai/:plan?', adminRateLimit, decodeToken, checkAdmin, (req, res) => {
  try {
    const { plan } = req.params;
    cacheService.invalidateAIResponses(plan);
    res.json({
      success: true,
      message: plan ? `AI cache invalidated for plan: ${plan}` : 'All AI cache entries invalidated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to invalidate AI cache'
    });
  }
});

export default router; 