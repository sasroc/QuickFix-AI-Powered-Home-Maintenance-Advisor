import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { apiRequest } from '../../services/apiConfig';
import { hasLifetimeAccess } from '../../utils/trialUtils';
import './PaymentPlan.css';

const PaymentPlan = ({ onSubscribe, currentPlan, userData, subscriptionStatus, showTrial = false }) => {
  const { currentUser } = useAuth();
  const { isDarkMode } = useTheme();
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [portalError, setPortalError] = useState('');

  const isLifetime = hasLifetimeAccess(userData);
  const isMonthlyActive = currentPlan === 'pro' && subscriptionStatus === 'active' && !isLifetime;
  const isLifetimeActive = isLifetime;

  const canStartTrial = currentUser && userData &&
    !userData.wasOnTrial &&
    subscriptionStatus !== 'active' &&
    !isLifetime;
  const shouldShowTrial = showTrial && canStartTrial;

  const handleManageSubscription = async () => {
    setLoadingPortal(true);
    setPortalError('');
    try {
      const authToken = await currentUser.getIdToken();
      const response = await apiRequest('api/stripe/create-portal-session', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ uid: currentUser.uid }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setPortalError('Failed to open Stripe portal.');
      }
    } catch (err) {
      console.error('Portal error:', err);
      setPortalError('Failed to open Stripe portal.');
    } finally {
      setLoadingPortal(false);
    }
  };

  return (
    <div className={`payment-plan-container ${!isDarkMode ? 'light' : ''}`}>
      {showTrial && !canStartTrial && currentUser && userData && (
        <div className="trial-eligibility-banner">
          {subscriptionStatus === 'active' ? (
            <>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#28a745' }}>✅ You're Already Subscribed!</h3>
              <p style={{ margin: 0, color: '#666' }}>
                You have an active subscription. Manage your current plan below or visit Account Settings.
              </p>
            </>
          ) : userData.wasOnTrial ? (
            <>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#f39c12' }}>⚠️ Trial Already Used</h3>
              <p style={{ margin: 0, color: '#666' }}>
                You've already used your free trial. Choose a plan below to continue using QuickFixAI.
              </p>
            </>
          ) : (
            <>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#dc3545' }}>❌ Trial Not Available</h3>
              <p style={{ margin: 0, color: '#666' }}>
                The free trial is not available for your account. Please choose a plan below.
              </p>
            </>
          )}
        </div>
      )}

      {shouldShowTrial && (
        <div className="trial-banner">
          <h2 className="trial-title">🚀 Start Your 5-Day FREE Pro Trial</h2>
          <p className="trial-subtitle">
            No risk, no commitment. Get full Pro access for 5 days and see how QuickFixAI transforms your home repairs.
          </p>
          <div className="trial-offer">
            <div className="trial-plan">
              <h3>Pro Plan Trial</h3>
              <div className="trial-price">
                <span className="original-price">$4.99/month</span>
                <span className="trial-price-text">FREE for 5 days</span>
              </div>
              <ul className="trial-features">
                <li>✅ 10 repair guides per month</li>
                <li>✅ Powered by the latest GPT model</li>
                <li>✅ Unlimited repair history</li>
                <li>✅ Text, voice & image inputs</li>
              </ul>
              <button
                className="trial-start-button"
                onClick={() => onSubscribe('pro', 'monthly', true)}
              >
                Start My Free Trial Now
              </button>
              <p className="trial-note">
                You'll only be charged after your 5-day trial ends. Cancel anytime.
              </p>
            </div>
          </div>
          <div className="trial-divider">
            <span>Or choose a plan below</span>
          </div>
        </div>
      )}

      <h2 className="payment-plan-title">
        {shouldShowTrial ? 'Regular Plans' : 'Subscribe to QuickFixAI Pro'}
      </h2>

      <div className="payment-plans-grid">
        {/* Pro Monthly */}
        <div className={`payment-plan ${isMonthlyActive ? 'current-plan' : ''}`}>
          {isMonthlyActive && (
            <div className="current-plan-badge">Current Plan</div>
          )}
          <h3 className="plan-label">Pro Monthly</h3>
          <div className="plan-price">
            <div className="price-amount">
              <span className="price">$4.99</span>
              <span className="period">per month</span>
            </div>
          </div>
          <ul className="plan-features">
            <li>10 repair guides per month</li>
            <li>Unlimited repair history</li>
            <li>
              Powered by <span className="ai-model pro">Latest GPT Model</span>
            </li>
            <li>Text, voice & image inputs</li>
            <li>Cancel anytime</li>
          </ul>
          <button
            className={`subscribe-button ${isMonthlyActive ? 'current-plan-button' : ''}`}
            onClick={isMonthlyActive ? handleManageSubscription : () => onSubscribe('pro', 'monthly')}
            disabled={loadingPortal || isLifetimeActive}
          >
            {isMonthlyActive
              ? (loadingPortal ? 'Loading...' : 'Manage Subscription')
              : 'Subscribe Monthly'}
          </button>
        </div>

        {/* Pro Lifetime */}
        <div className={`payment-plan popular ${isLifetimeActive ? 'current-plan' : ''}`}>
          {isLifetimeActive ? (
            <div className="current-plan-badge">Current Plan</div>
          ) : (
            <div className="popular-badge">Best Value</div>
          )}
          <h3 className="plan-label">Pro Lifetime</h3>
          <div className="plan-price">
            <div className="price-amount">
              <span className="price">$49.99</span>
              <span className="period">one-time payment</span>
            </div>
            <span className="annual-note">pay once, use forever</span>
          </div>
          <ul className="plan-features">
            <li>Unlimited repair guides — forever</li>
            <li>Unlimited repair history</li>
            <li>
              Powered by <span className="ai-model pro">Latest GPT Model</span>
            </li>
            <li>Text, voice & image inputs</li>
            <li>All future updates included</li>
          </ul>
          <button
            className={`subscribe-button ${isLifetimeActive ? 'current-plan-button' : ''}`}
            onClick={isLifetimeActive ? undefined : () => onSubscribe('pro', 'lifetime')}
            disabled={isLifetimeActive}
          >
            {isLifetimeActive ? 'Active — Lifetime Access' : 'Get Lifetime Access'}
          </button>
          {!isLifetimeActive && (
            <div className="yearly-save-note">
              Equivalent to ~10 months of monthly billing
            </div>
          )}
        </div>
      </div>

      {portalError && (
        <div style={{ color: 'red', textAlign: 'center', marginTop: 16 }}>
          {portalError}
        </div>
      )}
    </div>
  );
};

export default PaymentPlan;
