import { hasLifetimeAccess, getEffectiveSubscriptionStatus } from './trialUtils';

/**
 * Check if a user is eligible to start a free trial
 * @param {Object} userData - User data from Firestore
 * @returns {boolean} - Whether user can start a trial
 */
export const canUserStartTrial = (userData) => {
  if (!userData) return true; // New users can start trial
  
  // Lifetime users cannot start trials (they already have permanent access)
  if (hasLifetimeAccess(userData)) {
    return false;
  }
  
  // User cannot start trial if they already have an active subscription
  if (userData.subscriptionStatus === 'active') {
    return false;
  }
  
  // User cannot start trial if they have already used one
  if (userData.wasOnTrial) {
    return false;
  }
  
  return true;
};

/**
 * Get the reason why a user cannot start a trial
 * @param {Object} userData - User data from Firestore
 * @returns {string|null} - Reason why trial is not available, or null if eligible
 */
export const getTrialIneligibilityReason = (userData) => {
  if (!userData) return null; // New users are eligible
  
  if (hasLifetimeAccess(userData)) {
    return 'lifetime_access';
  }
  
  if (userData.subscriptionStatus === 'active') {
    return 'already_subscribed';
  }
  
  if (userData.wasOnTrial) {
    return 'trial_already_used';
  }
  
  return null; // User is eligible
};

/**
 * Check if user has an active subscription (including lifetime access)
 * @param {Object} userData - User data from Firestore
 * @returns {boolean} - Whether user has active subscription or lifetime access
 */
export const hasActiveSubscription = (userData) => {
  return userData?.subscriptionStatus === 'active' || hasLifetimeAccess(userData);
};

/**
 * Get user's subscription status display text
 * @param {Object} userData - User data from Firestore
 * @returns {string} - Human-readable status
 */
export const getSubscriptionStatusText = (userData) => {
  return getEffectiveSubscriptionStatus(userData);
}; 