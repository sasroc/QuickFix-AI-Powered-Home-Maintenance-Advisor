import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import PaymentPlan from '../pricing/PaymentPlan';
import { apiRequest } from '../../services/apiConfig';
import { hasTrialGracePeriodAccess, getTrialGracePeriodRemaining } from '../../utils/trialUtils';

const db = getFirestore();

const SubscriptionGate = ({ children }) => {
  const { currentUser } = useAuth();
  const [status, setStatus] = useState('loading');
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [error, setError] = useState('');
  const [currentPlan, setCurrentPlan] = useState(null);
  const [currentBilling, setCurrentBilling] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    const unsub = onSnapshot(userRef, (snap) => {
      if (!snap.exists()) {
        setStatus('none');
        setCurrentPlan(null);
        setCurrentBilling(null);
        setUserData(null);
      } else {
        const data = snap.data();
        setStatus(data.subscriptionStatus || 'inactive');
        setCurrentPlan(data.plan || null);
        setCurrentBilling(data.billingInterval || null);
        setUserData(data);
      }
    });
    return unsub;
  }, [currentUser]);

  const onSubscribe = async (plan, billing) => {
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

  if (status === 'loading') {
    return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Checking subscription...</div>;
  }
  
  // Check for trial grace period access
  const hasAccess = hasTrialGracePeriodAccess(userData);
  const gracePeriod = getTrialGracePeriodRemaining(userData);
  
  if (hasAccess) {
    return (
      <>
        {gracePeriod?.hasTimeLeft && (
          <div style={{
            background: 'linear-gradient(135deg, #fff3cd, #ffeaa7)',
            border: '2px solid #ffc107',
            borderRadius: '12px',
            padding: '1rem 1.5rem',
            margin: '1rem auto 2rem auto',
            maxWidth: '600px',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(255, 193, 7, 0.3)'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#856404', fontSize: '1.2rem' }}>
              ⚠️ Trial Access Ending Soon
            </h3>
            <p style={{ margin: 0, color: '#856404', fontWeight: '500' }}>
              You have <strong>{Math.floor(gracePeriod.hoursRemaining)} hours and {gracePeriod.minutesRemaining} minutes</strong> remaining 
              before your trial access expires. Subscribe now to continue using QuickFixAI!
            </p>
          </div>
        )}
        {children}
      </>
    );
  }
  
  return (
    <>
      <PaymentPlan 
        onSubscribe={onSubscribe} 
        currentPlan={currentPlan}
        currentBilling={currentBilling}
      />
      {loadingCheckout && <div style={{ textAlign: 'center', marginTop: 16 }}>Redirecting to checkout...</div>}
      {error && <div style={{ color: 'red', textAlign: 'center', marginTop: 16 }}>{error}</div>}
    </>
  );
};

export default SubscriptionGate; 