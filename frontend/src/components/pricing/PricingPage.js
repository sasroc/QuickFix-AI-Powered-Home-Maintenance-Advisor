import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import PaymentPlan from './PaymentPlan';
import { useNavigate } from 'react-router-dom';

const db = getFirestore();

const PricingPage = () => {
  const { currentUser } = useAuth();
  const [currentPlan, setCurrentPlan] = useState(null);
  const [currentBilling, setCurrentBilling] = useState(null);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    const unsub = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        setCurrentPlan(snap.data().plan || null);
        // Determine billing interval from subscription ID or other metadata
        // For now, we'll default to monthly if not specified
        setCurrentBilling(snap.data().billingInterval || 'monthly');
      }
    });
    return unsub;
  }, [currentUser]);

  const onSubscribe = async (plan, billing) => {
    if (!currentUser) {
      navigate('/auth');
      return;
    }
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

  return (
    <div className="pricing-page">
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