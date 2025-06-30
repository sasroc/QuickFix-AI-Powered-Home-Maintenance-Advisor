import admin from './firebaseAdmin';
import cacheService from '../services/cacheService';

// Grace period for trial access after cancellation (in hours)
// Set to 24 hours for production, can be changed for testing (e.g., 0.0167 for 1 minute)
export const TRIAL_GRACE_PERIOD_HOURS = parseFloat(process.env.TRIAL_GRACE_PERIOD_HOURS || '24');

/**
 * Clean up expired trial grace periods
 * This function should be called periodically (e.g., via cron job)
 * to update users whose 24-hour trial grace period has expired
 */
export const cleanupExpiredTrialGracePeriods = async (graceHours: number = TRIAL_GRACE_PERIOD_HOURS): Promise<void> => {
  try {
    console.log(`Starting trial grace period cleanup (${graceHours} hours)...`);
    
    // Calculate cutoff time (graceHours ago)
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - graceHours);
    const cutoffTimestamp = admin.firestore.Timestamp.fromDate(cutoffTime);
    
    // Find users with expired trial grace periods
    const usersRef = admin.firestore().collection('users');
    const expiredTrialsQuery = usersRef
      .where('wasOnTrial', '==', true)
      .where('trialCancelledAt', '<=', cutoffTimestamp);
    
    const querySnapshot = await expiredTrialsQuery.get();
    
    if (querySnapshot.empty) {
      console.log('No expired trial grace periods found');
      return;
    }
    
    console.log(`Found ${querySnapshot.size} expired trial grace periods to clean up`);
    
    // Batch update users to finalize trial expiration
    const batch = admin.firestore().batch();
    let updateCount = 0;
    
    querySnapshot.docs.forEach((doc) => {
      const userData = doc.data();
      
      // Only update if they still have trial status or haven't been marked as expired
      // and their subscription is not currently active
      if ((userData.isOnTrial || userData.subscriptionStatus !== 'inactive') && 
          userData.subscriptionStatus !== 'active' && 
          !userData.trialExpiredAt) {
        batch.update(doc.ref, {
          isOnTrial: false,
          subscriptionStatus: 'inactive',
          plan: 'none',
          credits: 0,
          // Keep wasOnTrial and trialCancelledAt for historical tracking
          trialExpiredAt: admin.firestore.Timestamp.now()
        });
        
        // Invalidate user cache for updated status
        cacheService.invalidateUserData(doc.id);
        updateCount++;
      }
    });
    
    if (updateCount > 0) {
      await batch.commit();
      console.log(`Successfully cleaned up ${updateCount} expired trial grace periods`);
    } else {
      console.log('No users needed cleanup');
    }
    
  } catch (error) {
    console.error('Error cleaning up expired trial grace periods:', error);
    throw error;
  }
};

/**
 * Check if a specific user's trial grace period has expired
 * and update them if needed
 */
export const checkAndUpdateUserTrialStatus = async (uid: string, graceHours: number = TRIAL_GRACE_PERIOD_HOURS): Promise<boolean> => {
  try {
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return false;
    }
    
    const userData = userDoc.data();
    
    // Check if user has an expired trial grace period
    if (userData?.wasOnTrial && userData?.trialCancelledAt && 
        userData?.subscriptionStatus !== 'active' && !userData?.trialExpiredAt) {
      const now = new Date();
      const cancelledAt = userData.trialCancelledAt.toDate();
      const hoursSinceCancellation = (now.getTime() - cancelledAt.getTime()) / (1000 * 60 * 60);
      
      // If more than graceHours have passed, update the user
      if (hoursSinceCancellation >= graceHours) {
        await userDoc.ref.update({
          isOnTrial: false,
          subscriptionStatus: 'inactive',
          plan: 'none',
          credits: 0,
          trialExpiredAt: admin.firestore.Timestamp.now()
        });
        
        // Invalidate user cache so frontend gets updated status immediately
        cacheService.invalidateUserData(uid);
        
        console.log(`Updated expired trial for user ${uid}`);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error(`Error checking trial status for user ${uid}:`, error);
    return false;
  }
}; 