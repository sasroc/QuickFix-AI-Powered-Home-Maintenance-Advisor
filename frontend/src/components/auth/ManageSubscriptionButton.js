import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const ManageSubscriptionButton = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleManage = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: currentUser.uid }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError('Failed to open Stripe portal.');
      }
    } catch (err) {
      setError('Failed to open Stripe portal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', margin: '2rem 0' }}>
      <button
        onClick={handleManage}
        disabled={loading}
        style={{
          background: '#ff5630',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          padding: '1rem 2.5rem',
          fontSize: '1.1rem',
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Loading...' : 'Manage Subscription'}
      </button>
      {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}
    </div>
  );
};

export default ManageSubscriptionButton; 