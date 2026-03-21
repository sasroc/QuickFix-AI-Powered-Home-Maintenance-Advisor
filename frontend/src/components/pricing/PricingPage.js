import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
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
  const [userData, setUserData] = useState(null);
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
        setCurrentBilling(data.billingInterval || 'annual');
        setSubscriptionStatus(data.subscriptionStatus || 'inactive');
        setUserData(data);
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

  const onSubscribe = async (plan, billing, isTrial = false) => {
    if (!currentUser) {
      navigate('/auth');
      return;
    }
    setLoadingCheckout(true);
    setError('');
    try {
      const endpoint = isTrial ? 'api/stripe/start-trial' : 'api/subscribe';
      const response = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({ 
          uid: currentUser.uid, 
          plan, 
          billing,
          ...(isTrial && { isTrial: true })
        }),
      });
      
      if (!response.ok) {
        // Handle HTTP error responses
        const errorData = await response.json();
        setError(errorData.message || 'Failed to start checkout. Please try again.');
        return;
      }
      
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.message || 'Failed to start checkout. Please try again.');
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
      <Helmet>
        <title>Pricing | QuickFix AI — Plans from $2/month, 5-Day Free Trial</title>
        <meta name="description" content="QuickFix AI plans start at $2/month. Get AI-powered home repair guides for plumbing, electrical, HVAC & more. Start with a 5-day free trial — no commitment required." />
        <link rel="canonical" href="https://quickfixai.com/pricing" />
      </Helmet>
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
        userData={userData}
        subscriptionStatus={subscriptionStatus}
        showTrial={location.state?.startTrial}
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