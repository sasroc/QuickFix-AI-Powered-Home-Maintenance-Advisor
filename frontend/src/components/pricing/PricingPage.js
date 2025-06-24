import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import PaymentPlan from './PaymentPlan';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiRequest } from '../../services/apiConfig';

const db = getFirestore();

const PricingPage = () => {
  const { currentUser } = useAuth();
  const [currentPlan, setCurrentPlan] = useState(null);
  const [currentBilling, setCurrentBilling] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    const unsub = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setCurrentPlan(data.plan || null);
        setCurrentBilling(data.billingInterval || 'monthly');
        setSubscriptionStatus(data.subscriptionStatus || 'inactive');
      }
    });
    return unsub;
  }, [currentUser]);

  // If user is already subscribed and they came from repair flow, redirect them back to repair
  useEffect(() => {
    if (subscriptionStatus === 'active' && location.state?.fromRepair) {
      navigate('/repair', { replace: true });
    }
  }, [subscriptionStatus, location.state, navigate]);

  const onSubscribe = async (plan, billing) => {
    if (!currentUser) {
      navigate('/auth');
      return;
    }
    setLoadingCheckout(true);
    setError('');
    try {
      const response = await apiRequest('api/subscribe', {
        method: 'POST',
        body: JSON.stringify({ uid: currentUser.uid, plan, billing }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError('Failed to start checkout. Please try again.');
      }
    } catch (err) {
      console.error('Subscription error:', err);
      setError('Failed to start checkout. Please try again.');
    } finally {
      setLoadingCheckout(false);
    }
  };

  return (
    <div className="pricing-page">
      {location.state?.fromRepair && (
        <div style={{ 
          textAlign: 'center', 
          padding: '1rem', 
          marginBottom: '1rem',
          backgroundColor: 'var(--card-bg)',
          color: 'var(--text-primary)',
          borderRadius: '8px',
          border: '2px solid var(--accent-primary)',
          maxWidth: '600px',
          margin: '0 auto 2rem auto'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--accent-primary)' }}>
            🔧 Subscribe to Access Repair Features
          </h3>
          <p style={{ margin: 0, fontSize: '1rem' }}>
            Choose a plan below to start getting AI-powered repair guides for your home maintenance needs.
          </p>
        </div>
      )}
      <PaymentPlan 
        onSubscribe={onSubscribe} 
        currentPlan={currentPlan}
        currentBilling={currentBilling}
      />
      {loadingCheckout && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          Redirecting to checkout...
        </div>
      )}
      {error && (
        <div style={{ color: 'red', textAlign: 'center', marginTop: 16 }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default PricingPage; 