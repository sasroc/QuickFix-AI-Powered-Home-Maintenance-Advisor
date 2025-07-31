import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { apiRequest } from '../../services/apiConfig';
import './PaymentPlan.css';

const plans = [
  {
    key: 'starter',
    label: 'Starter',
    monthly: 19,
    annual: 9,
    annualTotal: 108,
    features: [
      '25 repair guides per month (credits)',
      <span key="starter-ai">Powered by <span className="ai-model starter">GPT-4.1 Nano</span> - Basic, capable model for simple repairs</span>,
      'For individuals and light DIYers',
      'Access to standard repair guides',
      'Store up to 10 repair guides in history',
    ],
  },
  {
    key: 'pro',
    label: 'Pro',
    monthly: 49,
    annual: 29,
    annualTotal: 348,
    features: [
      '100 repair guides per month (credits)',
      <span key="pro-ai">Powered by <span className="ai-model pro">GPT-4o Mini</span> - Advanced model with enhanced accuracy and detailed solutions</span>,
      'For busy homeowners and advanced DIYers',
      'Access to all standard and advanced repair guides',
      'Early access to new features',
      'Store up to 50 repair guides in history',
    ],
  },
  {
    key: 'premium',
    label: 'Premium',
    monthly: 99,
    annual: 49,
    annualTotal: 588,
    features: [
      '500 repair guides per month (credits)',
      <span key="premium-ai">Powered by <span className="ai-model premium">GPT-4o</span> - Most advanced model with expert-level precision and comprehensive solutions</span>,
      'For professionals and power users',
      'All Pro features',
      'Unlimited repair history storage',
    ],
  },
];

const PaymentPlan = ({ onSubscribe, currentPlan, currentBilling, userData, subscriptionStatus, showTrial = false }) => {
  const { currentUser } = useAuth();
  const { isDarkMode } = useTheme();
  const [billing, setBilling] = useState(currentBilling || 'annual'); // 'monthly' or 'annual'
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [portalError, setPortalError] = useState('');

  // Determine if user can start a trial
  const canStartTrial = currentUser && userData && 
    !userData.wasOnTrial && 
    subscriptionStatus !== 'active';
  
  // Should show trial banner
  const shouldShowTrial = showTrial && canStartTrial;

  const handleSubscribe = (planKey, isTrial = false) => {
    if (onSubscribe) {
      onSubscribe(planKey, billing, isTrial);
    }
  };

  const handleManageSubscription = async () => {
    setLoadingPortal(true);
    setPortalError('');
    try {
      // Get authentication token
      const authToken = await currentUser.getIdToken();
      
      const response = await apiRequest('api/stripe/create-portal-session', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${authToken}`
        },
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

  const isCurrentPlan = (planKey) => {
    return currentPlan === planKey && currentBilling === billing;
  };

  return (
    <div className={`payment-plan-container ${!isDarkMode ? 'light' : ''}`}>
      {/* Show trial eligibility message if trial was requested but user can't use it */}
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
                You've already used your free trial. Choose a subscription plan below to continue using QuickFixAI.
              </p>
            </>
          ) : (
            <>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#dc3545' }}>❌ Trial Not Available</h3>
              <p style={{ margin: 0, color: '#666' }}>
                The free trial is not available for your account. Please choose a subscription plan below.
              </p>
            </>
          )}
        </div>
      )}
      
      {shouldShowTrial && (
        <div className="trial-banner">
          <h2 className="trial-title">🚀 Start Your 5-Day FREE Starter Trial</h2>
          <p className="trial-subtitle">
            No risk, no commitment. Get full access to Starter features for 5 days and see how QuickFixAI transforms your home repairs.
          </p>
          <div className="trial-offer">
            <div className="trial-plan">
              <h3>Starter Plan Trial</h3>
              <div className="trial-price">
                <span className="original-price">$19/month</span>
                <span className="trial-price-text">FREE for 5 days</span>
              </div>
              <ul className="trial-features">
                <li>✅ 25 repair guides (credits)</li>
                <li>✅ Powered by GPT-4.1 Nano</li>
                <li>✅ Unlimited text, voice & image inputs</li>
                <li>✅ Standard repair guides with safety tips</li>
                <li>✅ Save up to 10 repair guides</li>
                <li>✅ Community access</li>
              </ul>
              <button 
                className="trial-start-button"
                onClick={() => handleSubscribe('starter', true)}
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
      <h2 className="payment-plan-title">{shouldShowTrial ? 'Regular Subscription Plans' : 'Subscribe to unlock QuickFixAI'}</h2>
      <div className="billing-toggle">
        <button
          className={`billing-button ${billing === 'monthly' ? 'active' : ''}`}
          onClick={() => setBilling('monthly')}
        >
          Monthly
        </button>
        <button
          className={`billing-button ${billing === 'annual' ? 'active' : ''}`}
          onClick={() => setBilling('annual')}
        >
          Yearly <span className="save-badge">Save 53%</span>
        </button>
      </div>
      <div className="payment-plans-grid">
        {plans.map((plan) => (
          <div
            key={plan.key}
            className={`payment-plan ${plan.key === 'pro' ? 'popular' : ''} ${isCurrentPlan(plan.key) ? 'current-plan' : ''}`}
          >
            {plan.key === 'pro' && !isCurrentPlan(plan.key) && (
              <div className="popular-badge">
                Most Popular
              </div>
            )}
            {isCurrentPlan(plan.key) && (
              <div className="current-plan-badge">
                Current Plan
              </div>
            )}
            <h3 className="plan-label">{plan.label}</h3>
            <div className="plan-price">
              <div className="price-amount">
                <span className="price">
                  ${billing === 'monthly' ? plan.monthly : plan.annual}
                </span>
                <span className="period">per month</span>
              </div>
              {billing === 'annual' && (
                <span className="annual-note">
                  billed annually ${plan.annualTotal}
                </span>
              )}
            </div>
            <ul className="plan-features">
              {plan.features.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
            <button
              className={`subscribe-button ${isCurrentPlan(plan.key) ? 'current-plan-button' : ''}`}
              onClick={isCurrentPlan(plan.key) ? handleManageSubscription : () => handleSubscribe(plan.key)}
              disabled={loadingPortal}
            >
              {isCurrentPlan(plan.key) ? (loadingPortal ? 'Loading...' : 'Manage Subscription') : 'Subscribe'}
            </button>
            {billing === 'monthly' && !isCurrentPlan(plan.key) && (
              <div className="yearly-save-note">
                Save with yearly
              </div>
            )}
          </div>
        ))}
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