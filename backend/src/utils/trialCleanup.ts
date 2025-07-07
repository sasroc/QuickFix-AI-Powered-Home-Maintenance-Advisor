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

/**
 * Reset credits for lifetime users on a monthly basis
 * This function should be called monthly via a cron job
 */
export const resetLifetimeUserCredits = async (): Promise<void> => {
  try {
    console.log('Starting monthly credit reset for lifetime users...');
    
    // Find all users with lifetime access
    const usersRef = admin.firestore().collection('users');
    const lifetimeUsersQuery = usersRef.where('hasLifetimeAccess', '==', true);
    
    const querySnapshot = await lifetimeUsersQuery.get();
    
    if (querySnapshot.empty) {
      console.log('No lifetime users found for credit reset');
      return;
    }
    
    console.log(`Found ${querySnapshot.size} lifetime users for credit reset`);
    
    // Batch update users to reset their credits
    const batch = admin.firestore().batch();
    const STARTER_PLAN_CREDITS = 25; // Lifetime users get starter plan features
    let updateCount = 0;
    
    for (const doc of querySnapshot.docs) {
      const userData = doc.data();
      
      // Check if user is eligible for credit reset (hasn't been reset this month)
      const isEligible = await isEligibleForCreditReset(userData);
      
      if (isEligible) {
        batch.update(doc.ref, {
          credits: STARTER_PLAN_CREDITS,
          lastCreditReset: admin.firestore.Timestamp.now(),
          plan: 'starter' // Ensure lifetime users always have starter plan
        });
        
        // Invalidate user cache for updated credits
        cacheService.invalidateUserData(doc.id);
        updateCount++;
      }
    }
    
    if (updateCount > 0) {
      await batch.commit();
      console.log(`Successfully reset credits for ${updateCount} lifetime users`);
    } else {
      console.log('No lifetime users were eligible for credit reset this month');
    }
    
  } catch (error) {
    console.error('Error resetting credits for lifetime users:', error);
    throw error;
  }
};

/**
 * Check if a user is eligible for monthly credit reset
 * Users are eligible if at least 30 days have passed since their last credit reset
 */
const isEligibleForCreditReset = async (userData: any): Promise<boolean> => {
  // If no lastCreditReset exists, user is eligible
  if (!userData.lastCreditReset) {
    return true;
  }
  
  const now = new Date();
  const lastReset = userData.lastCreditReset.toDate();
  
  // Calculate the difference in days
  const daysDifference = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
  
  // Eligible if at least 30 days have passed since last reset
  return daysDifference >= 30;
};

/**
 * Reset credits for a specific lifetime user if eligible
 * Useful for manual resets or when users are added to lifetime access
 */
export const resetLifetimeUserCreditsForUser = async (uid: string): Promise<boolean> => {
  try {
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      console.log(`User ${uid} not found`);
      return false;
    }
    
    const userData = userDoc.data();
    
    // Check if user has lifetime access
    if (!userData?.hasLifetimeAccess) {
      console.log(`User ${uid} does not have lifetime access`);
      return false;
    }
    
    // Check if user is eligible for credit reset
    const isEligible = await isEligibleForCreditReset(userData);
    
    if (!isEligible) {
      console.log(`User ${uid} is not eligible for credit reset this month`);
      return false;
    }
    
    const STARTER_PLAN_CREDITS = 25;
    
    await userDoc.ref.update({
      credits: STARTER_PLAN_CREDITS,
      lastCreditReset: admin.firestore.Timestamp.now(),
      plan: 'starter'
    });
    
    // Invalidate user cache
    cacheService.invalidateUserData(uid);
    
    console.log(`Successfully reset credits for lifetime user ${uid}`);
    return true;
    
  } catch (error) {
    console.error(`Error resetting credits for lifetime user ${uid}:`, error);
    return false;
  }
};

/**
 * Reset credits for annual subscribers (monthly reset)
 * Annual users get monthly credit resets even though they're billed annually
 */
export const resetAnnualSubscriberCredits = async (): Promise<void> => {
  try {
    console.log('Starting monthly credit reset for annual subscribers...');
    
    // Find all users with active annual subscriptions
    const usersRef = admin.firestore().collection('users');
    const annualUsersQuery = usersRef
      .where('subscriptionStatus', '==', 'active')
      .where('billingInterval', '==', 'annual');
    
    const querySnapshot = await annualUsersQuery.get();
    
    if (querySnapshot.empty) {
      console.log('No annual subscribers found for credit reset');
      return;
    }
    
    console.log(`Found ${querySnapshot.size} annual subscribers for credit reset`);
    
    // Helper function to get credit allocation for a plan
    const getPlanCredits = (plan: string): number => {
      const planCredits: { [key: string]: number } = {
        'none': 0,
        'starter': 25,
        'pro': 100,
        'premium': 500
      };
      return planCredits[plan] || 25;
    };
    
    // Batch update users to reset their credits
    const batch = admin.firestore().batch();
    let updateCount = 0;
    
    for (const doc of querySnapshot.docs) {
      const userData = doc.data();
      
      // Skip lifetime users (they have their own reset system)
      if (userData?.hasLifetimeAccess) {
        continue;
      }
      
      // Check if user is eligible for credit reset (hasn't been reset this month)
      const isEligible = await isEligibleForCreditReset(userData);
      
      if (isEligible) {
        const userPlan = userData.plan || 'starter';
        const creditsToReset = getPlanCredits(userPlan);
        
        batch.update(doc.ref, {
          credits: creditsToReset,
          lastCreditReset: admin.firestore.Timestamp.now()
        });
        
        // Invalidate user cache for updated credits
        cacheService.invalidateUserData(doc.id);
        updateCount++;
      }
    }
    
    if (updateCount > 0) {
      await batch.commit();
      console.log(`Successfully reset credits for ${updateCount} annual subscribers`);
    } else {
      console.log('No annual subscribers were eligible for credit reset this month');
    }
    
  } catch (error) {
    console.error('Error resetting credits for annual subscribers:', error);
    throw error;
  }
};

/**
 * Reset credits for a specific annual subscriber if eligible
 */
export const resetAnnualSubscriberCreditsForUser = async (uid: string): Promise<boolean> => {
  try {
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      console.log(`User ${uid} not found`);
      return false;
    }
    
    const userData = userDoc.data();
    
    // Check if user is an active annual subscriber
    if (userData?.subscriptionStatus !== 'active' || userData?.billingInterval !== 'annual') {
      console.log(`User ${uid} is not an active annual subscriber`);
      return false;
    }
    
    // Skip lifetime users
    if (userData?.hasLifetimeAccess) {
      console.log(`User ${uid} has lifetime access, use lifetime reset endpoint instead`);
      return false;
    }
    
    // Check if user is eligible for credit reset
    const isEligible = await isEligibleForCreditReset(userData);
    
    if (!isEligible) {
      console.log(`User ${uid} is not eligible for credit reset this month`);
      return false;
    }
    
    // Helper function to get credit allocation for a plan
    const getPlanCredits = (plan: string): number => {
      const planCredits: { [key: string]: number } = {
        'none': 0,
        'starter': 25,
        'pro': 100,
        'premium': 500
      };
      return planCredits[plan] || 25;
    };
    
    const userPlan = userData.plan || 'starter';
    const creditsToReset = getPlanCredits(userPlan);
    
    await userDoc.ref.update({
      credits: creditsToReset,
      lastCreditReset: admin.firestore.Timestamp.now()
    });
    
    // Invalidate user cache
    cacheService.invalidateUserData(uid);
    
    console.log(`Successfully reset credits for annual subscriber ${uid} (${userPlan} plan): ${creditsToReset} credits`);
    return true;
    
  } catch (error) {
    console.error(`Error resetting credits for annual subscriber ${uid}:`, error);
    return false;
  }
}; 