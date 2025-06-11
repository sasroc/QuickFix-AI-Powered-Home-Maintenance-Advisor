import React, { useState } from 'react';

const plans = [
  {
    key: 'starter',
    label: 'Starter',
    monthly: 19,
    annual: 9,
    annualTotal: 108,
    features: [
      '50 repair guides per month',
      'Powered by GPT-4.1 Nano',
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
      'Powered by GPT-4o Mini',
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
      'Powered by GPT-4o',
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
    <div style={{
      background: '#18181b',
      color: '#fff',
      borderRadius: '16px',
      padding: '2rem',
      maxWidth: 1200,
      margin: '2rem auto',
      boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
      textAlign: 'center',
    }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Subscribe to unlock QuickFixAI</h2>
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'center', gap: 0 }}>
        <button
          style={{
            background: billing === 'monthly' ? 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)' : '#333',
            color: '#fff',
            border: 'none',
            borderRadius: '8px 0 0 8px',
            padding: '0.6rem 2.5rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '1.1rem',
          }}
          onClick={() => setBilling('monthly')}
        >
          Monthly
        </button>
        <button
          style={{
            background: billing === 'annual' ? 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)' : '#333',
            color: '#fff',
            border: 'none',
            borderRadius: '0 8px 8px 0',
            padding: '0.6rem 2.5rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '1.1rem',
          }}
          onClick={() => setBilling('annual')}
        >
          Yearly
        </button>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 32,
          flexWrap: 'nowrap',
          alignItems: 'stretch',
          width: '100%',
          minWidth: 0,
        }}
      >
        {plans.map((plan) => (
          <div
            key={plan.key}
            style={{
              background: '#23272f',
              borderRadius: 14,
              boxShadow: '0 2px 12px rgba(59,130,246,0.10)',
              padding: '2rem 2rem 1.5rem 2rem',
              minWidth: 280,
              maxWidth: 340,
              flex: 1,
              margin: '0 8px',
              textAlign: 'left',
              border: plan.key === 'pro' ? '2.5px solid #3b82f6' : '1.5px solid #333',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {plan.key === 'pro' && (
              <div style={{
                position: 'absolute',
                top: 18,
                right: 18,
                background: 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)',
                color: '#fff',
                borderRadius: 8,
                padding: '0.2rem 0.9rem',
                fontWeight: 700,
                fontSize: '0.95rem',
                letterSpacing: 0.5,
              }}>
                Most Popular
              </div>
            )}
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>{plan.label}</h3>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '2.6rem', fontWeight: 800, color: '#e5e7eb', lineHeight: 1 }}>
                  ${billing === 'monthly' ? plan.monthly : plan.annual}
                </span>
                <span style={{ fontSize: '1.15rem', color: '#e5e7eb', fontWeight: 700, marginTop: 0 }}>
                  per month
                </span>
              </div>
              {billing === 'annual' && (
                <span style={{ fontSize: '1.1rem', color: '#a3a3a3', fontWeight: 500, marginLeft: 12, marginTop: 8 }}>
                  billed annually ${plan.annualTotal}
                </span>
              )}
            </div>
            <ul style={{ margin: '1.2rem 0 1.5rem 0', padding: 0, listStyle: 'none' }}>
              {plan.features.map((f, i) => (
                <li key={i} style={{ marginBottom: 8, color: '#e5e7eb', fontSize: '1.08rem' }}>• {f}</li>
              ))}
            </ul>
            <button
              style={{
                background: 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.9rem 2.2rem',
                fontSize: '1.1rem',
                fontWeight: 700,
                cursor: 'pointer',
                width: '100%',
                marginTop: 8,
              }}
              onClick={() => handleSubscribe(plan.key)}
            >
              Subscribe
            </button>
          </div>
        ))}
      </div>
      <style>{`
        @media (max-width: 1100px) {
          .payment-plan-row {
            flex-wrap: wrap !important;
          }
        }
        @media (max-width: 900px) {
          .payment-plan-row {
            flex-direction: column !important;
            align-items: center !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentPlan; 