/**
 * Check if a user has access to premium features
 * Trial users lose access immediately when they cancel (no grace period)
 * Regular paid subscribers may have grace periods based on billing cycles
 */
export const hasPremiumAccess = (userData) => {
  if (!userData) return false;
  
  // If subscription is active, they have access
  if (userData.subscriptionStatus === 'active') {
    return true;
  }
  
  // If user is currently on trial (and hasn't cancelled), they have access
  if (userData.isOnTrial) {
    return true;
  }
  
  // IMPORTANT: Cancelled trial users lose access immediately (no grace period)
  // This is different from regular paid subscribers who might get access until period end
  if (userData.wasOnTrial && userData.trialCancelledAt) {
    return false; // Immediate access revocation for trial cancellations
  }
  
  // For regular paid subscribers (not trial users), check if they have grace period access
  // This would apply to users who had paid subscriptions and cancelled
  if (userData.subscriptionStatus === 'canceled' && !userData.wasOnTrial) {
    // Regular subscribers might get access until end of billing period
    // For now, revoke access immediately, but this could be enhanced later
    return false;
  }
  
  return false;
};

// Backward compatibility alias
export const hasTrialGracePeriodAccess = hasPremiumAccess;

/**
 * Get remaining grace period time for trial users
 * NOTE: Trial users no longer get grace periods - they lose access immediately when cancelled
 * This function is kept for backward compatibility but will always return null for cancelled trials
 */
export const getTrialGracePeriodRemaining = (userData) => {
  // Trial users no longer get grace periods - return null
  if (userData?.wasOnTrial && userData?.trialCancelledAt) {
    return {
      hoursRemaining: 0,
      minutesRemaining: 0,
      hasTimeLeft: false
    };
  }
  
  // For other cases (regular subscribers), we might implement grace periods in the future
  return null;
};

/**
 * Get remaining trial time based on trialEndDate
 * @param {Object} userData - User data from Firestore
 * @returns {Object|null} - Trial time remaining or null if not on trial
 */
export const getTrialTimeRemaining = (userData) => {
  if (!userData?.isOnTrial || !userData?.trialEndDate) {
    return null;
  }

  const now = new Date();
  const trialEndDate = userData.trialEndDate.toDate ? 
    userData.trialEndDate.toDate() : 
    new Date(userData.trialEndDate);
  
  const timeRemaining = trialEndDate.getTime() - now.getTime();
  
  // If trial has expired
  if (timeRemaining <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      isExpired: true,
      totalHours: 0
    };
  }
  
  const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const totalHours = Math.floor(timeRemaining / (1000 * 60 * 60));
  
  return {
    days,
    hours,
    minutes,
    isExpired: false,
    totalHours,
    endDate: trialEndDate
  };
};

/**
 * Format trial time remaining for display
 * @param {Object} userData - User data from Firestore
 * @returns {string} - Formatted time remaining text
 */
export const formatTrialTimeRemaining = (userData) => {
  const timeRemaining = getTrialTimeRemaining(userData);
  
  if (!timeRemaining) {
    return null;
  }
  
  if (timeRemaining.isExpired) {
    return 'Trial expired';
  }
  
  // Show detailed time breakdown
  const parts = [];
  
  if (timeRemaining.days > 0) {
    parts.push(`${timeRemaining.days} day${timeRemaining.days > 1 ? 's' : ''}`);
  }
  
  if (timeRemaining.hours > 0) {
    parts.push(`${timeRemaining.hours} hour${timeRemaining.hours > 1 ? 's' : ''}`);
  }
  
  if (timeRemaining.minutes > 0) {
    parts.push(`${timeRemaining.minutes} minute${timeRemaining.minutes > 1 ? 's' : ''}`);
  }
  
  // If no time parts, show less than a minute
  if (parts.length === 0) {
    return 'Less than a minute left';
  }
  
  return parts.join(', ') + ' left';
}; 