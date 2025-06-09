import React from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentSuccess = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      background: '#18181b',
      color: '#fff',
      padding: '2rem',
      borderRadius: '16px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.2)'
    }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎉 Thank You for Subscribing!</h1>
      <p style={{ fontSize: '1.25rem', marginBottom: '2rem', maxWidth: 500, textAlign: 'center' }}>
        Welcome to QuickFix! Your subscription is now active. We're excited to help you with all your home maintenance needs.
      </p>
      <button
        style={{
          padding: '1rem 2.5rem',
          fontSize: '1.2rem',
          background: '#ff5630',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 600,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
        onClick={() => navigate('/repair')}
      >
        Start Using QuickFix
      </button>
    </div>
  );
};

export default PaymentSuccess; 