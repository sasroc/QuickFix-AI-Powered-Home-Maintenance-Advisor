/**
 * Check if a user has access during trial cancellation grace period
 * Trial users get 24 hours of access after cancelling their subscription
 */
export const hasTrialGracePeriodAccess = (userData) => {
  if (!userData) return false;
  
  // If subscription is active, they have access
  if (userData.subscriptionStatus === 'active') {
    return true;
  }
  
  // Check if this is a cancelled trial user with grace period
  if (userData.wasOnTrial && userData.trialCancelledAt) {
    const now = new Date();
    const cancelledAt = userData.trialCancelledAt.toDate ? 
      userData.trialCancelledAt.toDate() : 
      new Date(userData.trialCancelledAt);
    
    // Calculate hours since cancellation
    const hoursSinceCancellation = (now.getTime() - cancelledAt.getTime()) / (1000 * 60 * 60);
    
    // Allow access for 24 hours after trial cancellation
    const GRACE_PERIOD_HOURS = 24;
    return hoursSinceCancellation < GRACE_PERIOD_HOURS;
  }
  
  return false;
};

/**
 * Get remaining grace period time for trial users
 */
export const getTrialGracePeriodRemaining = (userData) => {
  if (!userData?.wasOnTrial || !userData?.trialCancelledAt) {
    return null;
  }
  
  const now = new Date();
  const cancelledAt = userData.trialCancelledAt.toDate ? 
    userData.trialCancelledAt.toDate() : 
    new Date(userData.trialCancelledAt);
  
  const hoursSinceCancellation = (now.getTime() - cancelledAt.getTime()) / (1000 * 60 * 60);
  const GRACE_PERIOD_HOURS = 24; // Should match backend TRIAL_GRACE_PERIOD_HOURS
  const hoursRemaining = Math.max(0, GRACE_PERIOD_HOURS - hoursSinceCancellation);
  
  return {
    hoursRemaining,
    minutesRemaining: Math.max(0, Math.floor((hoursRemaining % 1) * 60)),
    hasTimeLeft: hoursRemaining > 0
  };
}; 