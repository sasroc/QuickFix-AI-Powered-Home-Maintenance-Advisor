import React, { useState } from 'react';

const plans = {
  monthly: {
    price: 20,
    label: 'Monthly Subscription',
    description: 'Billed monthly',
    features: [
      'Unlimited access to AI-driven repair guides',
      'Complete tool and material lists for every project',
      'Step-by-step instructions for all skill levels',
    ],
  },
  annual: {
    price: 120,
    label: 'Annual Subscription',
    description: 'Billed annually (Save 50% compared to monthly billing!)',
    features: [
      'Everything in the Monthly Plan, plus:',
      'Full year of unlimited repair guides at a discount',
      'Priority access to new features (coming soon)',
      'Exclusive DIY tips and updates',
    ],
  },
};

const PaymentPlan = ({ onSubscribe }) => {
  const [plan, setPlan] = useState('monthly');

  const current = plans[plan];

  return (
    <div style={{
      background: '#18181b',
      color: '#fff',
      borderRadius: '16px',
      padding: '2rem',
      maxWidth: 400,
      margin: '2rem auto',
      boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
      textAlign: 'center',
    }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Subscribe to unlock QuickFixAI</h2>
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          style={{
            background: plan === 'monthly' ? '#ff5630' : '#333',
            color: '#fff',
            border: 'none',
            borderRadius: '8px 0 0 8px',
            padding: '0.5rem 1.5rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
          onClick={() => setPlan('monthly')}
        >
          Monthly
        </button>
        <button
          style={{
            background: plan === 'annual' ? '#ff5630' : '#333',
            color: '#fff',
            border: 'none',
            borderRadius: '0 8px 8px 0',
            padding: '0.5rem 1.5rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
          onClick={() => setPlan('annual')}
        >
          Annual
        </button>
      </div>
      <div style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        {plan === 'monthly' ? '$20.00/mo' : '$120/year'}
      </div>
      <div style={{ marginBottom: '1rem', color: '#aaa' }}>{current.description}</div>
      <ul style={{ textAlign: 'left', margin: '0 auto 1.5rem', maxWidth: 320 }}>
        {current.features.map((f, i) => (
          <li key={i} style={{ marginBottom: 6 }}>{f}</li>
        ))}
      </ul>
      <button
        style={{
          background: '#ff5630',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          padding: '1rem 2.5rem',
          fontSize: '1.1rem',
          fontWeight: 600,
          cursor: 'pointer',
        }}
        onClick={() => onSubscribe(plan)}
      >
        Subscribe
      </button>
    </div>
  );
};

export default PaymentPlan; 