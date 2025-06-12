import React, { useState } from 'react';
import './PaymentPlan.css';

const plans = [
  {
    key: 'starter',
    label: 'Starter',
    monthly: 19,
    annual: 9,
    annualTotal: 108,
    features: [
      '50 repair guides per month',
      'Powered by GPT-4.1 Nano - Basic, capable model for simple repairs',
      'For individuals and light DIYers',
      'Access to standard repair guides',
    ],
  },
  {
    key: 'pro',
    label: 'Pro',
    monthly: 49,
    annual: 29,
    annualTotal: 348,
    features: [
      '100 repair guides per month',
      'Powered by GPT-4o Mini - Advanced model with enhanced accuracy and detailed solutions',
      'For busy homeowners and advanced DIYers',
      'Access to all standard and advanced repair guides',
      'Early access to new features',
    ],
  },
  {
    key: 'premium',
    label: 'Premium',
    monthly: 99,
    annual: 49,
    annualTotal: 588,
    features: [
      '500 repair guides per month',
      'Powered by GPT-4o - Most advanced model with expert-level precision and comprehensive solutions',
      'For professionals and power users',
      'All Pro features',
    ],
  },
];

const PaymentPlan = ({ onSubscribe }) => {
  const [billing, setBilling] = useState('monthly'); // 'monthly' or 'annual'

  const handleSubscribe = (planKey) => {
    if (onSubscribe) {
      onSubscribe(planKey, billing);
    }
  };

  return (
    <div className="payment-plan-container">
      <h2 className="payment-plan-title">Subscribe to unlock QuickFixAI</h2>
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
          Yearly
        </button>
      </div>
      <div className="payment-plans-grid">
        {plans.map((plan) => (
          <div
            key={plan.key}
            className={`payment-plan ${plan.key === 'pro' ? 'popular' : ''}`}
          >
            {plan.key === 'pro' && (
              <div className="popular-badge">
                Most Popular
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
              className="subscribe-button"
              onClick={() => handleSubscribe(plan.key)}
            >
              Subscribe
            </button>
            {billing === 'monthly' && (
              <div className="yearly-save-note">
                Save with yearly
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentPlan; 