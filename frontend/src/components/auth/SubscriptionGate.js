import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import PaymentPlan from '../pricing/PaymentPlan';

const db = getFirestore();

const SubscriptionGate = ({ children }) => {
  const { currentUser } = useAuth();
  const [status, setStatus] = useState('loading');
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [error, setError] = useState('');
  const [currentPlan, setCurrentPlan] = useState(null);
  const [currentBilling, setCurrentBilling] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    const unsub = onSnapshot(userRef, (snap) => {
      if (!snap.exists()) {
        setStatus('none');
        setCurrentPlan(null);
        setCurrentBilling(null);
      } else {
        const data = snap.data();
        setStatus(data.subscriptionStatus || 'inactive');
        setCurrentPlan(data.plan || null);
        setCurrentBilling(data.billingInterval || null);
      }
    });
    return unsub;
  }, [currentUser]);

  const onSubscribe = async (plan, billing) => {
    setLoadingCheckout(true);
    setError('');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: currentUser.uid, plan, billing }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError('Failed to start checkout. Please try again.');
      }
    } catch (err) {
      setError('Failed to start checkout. Please try again.');
    } finally {
      setLoadingCheckout(false);
    }
  };

  if (status === 'loading') {
    return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Checking subscription...</div>;
  }
  if (status === 'active') {
    return <>{children}</>;
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