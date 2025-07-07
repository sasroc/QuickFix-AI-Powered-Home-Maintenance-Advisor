import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import PaymentPlan from '../pricing/PaymentPlan';
import { apiRequest } from '../../services/apiConfig';
import { hasTrialGracePeriodAccess, getTrialGracePeriodRemaining, hasPremiumAccess, hasLifetimeAccess } from '../../utils/trialUtils';
import { canUserStartTrial, getTrialIneligibilityReason } from '../../utils/subscriptionUtils';

const db = getFirestore();

const SubscriptionGate = ({ children }) => {
  const { currentUser } = useAuth();
  const [status, setStatus] = useState('loading');
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    const unsub = onSnapshot(userRef, (snap) => {
      if (!snap.exists()) {
        setStatus('none');
        setUserData(null);
      } else {
        const data = snap.data();
        setStatus(data.subscriptionStatus || 'inactive');
        setUserData(data);
      }
    });
    return unsub;
  }, [currentUser]);

  const onSubscribe = async (plan, billing, isTrial = false) => {
    setLoadingCheckout(true);
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
        const errorData = await response.json();
        console.error('Subscription error:', errorData);
        return;
      }
      
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Failed to start checkout');
      }
    } catch (err) {
      console.error('Subscription error:', err);
    } finally {
      setLoadingCheckout(false);
    }
  };

  if (status === 'loading') {
    return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Checking subscription...</div>;
  }
  
  // Check access
  const hasAccess = hasPremiumAccess(userData);
  const isLifetimeUser = hasLifetimeAccess(userData);
  const hasGracePeriod = hasTrialGracePeriodAccess(userData);
  const gracePeriodTime = getTrialGracePeriodRemaining(userData);
  
  // If user has premium access (including lifetime), show content
  if (hasAccess) {
    return children;
  }

  // If user has grace period access, show grace period warning
  if (hasGracePeriod && gracePeriodTime) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <h2>⚠️ Grace Period Active</h2>
        <p>Your trial has ended, but you still have {gracePeriodTime} to subscribe.</p>
        <p>After this period, access will be restricted.</p>
        <PaymentPlan 
          onSubscribe={onSubscribe}
          currentPlan={userData?.plan}
          currentBilling={userData?.billingInterval || 'annual'}
          userData={userData}
          subscriptionStatus={status}
        />
      </div>
    );
  }

  // Show subscription prompt for users without access
  const trialEligible = canUserStartTrial(userData);
  const ineligibilityReason = getTrialIneligibilityReason(userData);

  // Special handling for lifetime users (shouldn't reach here, but safety check)
  if (isLifetimeUser) {
    return children;
  }

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2>🔒 Premium Access Required</h2>
      
      {trialEligible ? (
        <>
          <p>Start your free trial to access this feature!</p>
          <button 
            onClick={() => onSubscribe('starter', 'monthly')} 
            disabled={loadingCheckout}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: 'pointer',
              margin: '10px',
              opacity: loadingCheckout ? 0.6 : 1
            }}
          >
            {loadingCheckout ? 'Starting Trial...' : 'Start Free Trial'}
          </button>
        </>
      ) : (
        <>
          {ineligibilityReason === 'trial_already_used' && (
            <p>You've already used your free trial. Subscribe to continue accessing premium features.</p>
          )}
          {ineligibilityReason === 'already_subscribed' && (
            <p>You have an active subscription but may need to refresh the page.</p>
          )}
          {ineligibilityReason === 'lifetime_access' && (
            <p>You have lifetime access! Please refresh the page if you're seeing this.</p>
          )}
        </>
      )}
      
      <PaymentPlan 
        onSubscribe={onSubscribe}
        currentPlan={userData?.plan}
        currentBilling={userData?.billingInterval || 'annual'}
        userData={userData}
        subscriptionStatus={status}
      />
    </div>
  );
};

export default SubscriptionGate; 