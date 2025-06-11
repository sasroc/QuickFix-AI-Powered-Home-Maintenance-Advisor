import React, { useState, useEffect } from 'react';
import InputForm from '../forms/InputForm';
import RepairGuide from './RepairGuide';
import { analyzeRepairIssue } from '../../services/aiService';
import SubscriptionGate from '../auth/SubscriptionGate';
import { useAuth } from '../../contexts/AuthContext';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const db = getFirestore();

// Plan credit limits for progress bar
const PLAN_CREDITS = {
  starter: 50,
  pro: 100,
  premium: 500
};

function RepairPage() {
  const [repairData, setRepairData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [credits, setCredits] = useState(null);
  const [plan, setPlan] = useState('starter');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    const unsub = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        setCredits(snap.data().credits);
        setPlan(snap.data().plan || 'starter');
      }
    });
    return unsub;
  }, [currentUser]);

  const handleSubmit = async (input) => {
    setIsLoading(true);
    try {
      // Call the backend AI service
      const aiResponse = await analyzeRepairIssue({
        description: input.text,
        image: input.image,
        uid: currentUser?.uid
      });

      // Map the AI response to the format expected by RepairGuide
      const mappedResponse = {
        title: input.text || 'Repair Guide',
        steps: Array.isArray(aiResponse.steps)
          ? aiResponse.steps.map((desc, idx) => ({ description: desc, image: null }))
          : [],
        tools: aiResponse.tools || [],
        materials: aiResponse.materials || [],
        estimatedTime: aiResponse.estimatedTime
          ? `${aiResponse.estimatedTime} minutes`
          : '',
        confidenceScore: aiResponse.confidenceScore || null,
        imageAnalysis: aiResponse.imageAnalysis || null
      };

      setRepairData(mappedResponse);
    } catch (error) {
      console.error('Error processing repair request:', error);
      // TODO: Add proper error handling/UI feedback
    } finally {
      setIsLoading(false);
    }
  };

  const outOfCredits = credits !== null && credits <= 0;
  const maxCredits = PLAN_CREDITS[plan] || 50;
  const percent = credits !== null ? Math.max(0, Math.min(100, Math.round((credits / maxCredits) * 100))) : 100;

  return (
    <SubscriptionGate>
      <div className="App" style={{ 
        maxWidth: 700, 
        margin: '0 auto', 
        padding: '2rem 0',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: 24, 
          justifyContent: 'space-between',
          padding: '1rem 2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <span style={{
              background: 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)',
              color: '#fff',
              borderRadius: 9999,
              padding: '0.5rem 1.3rem',
              fontWeight: 700,
              fontSize: '1.1rem',
              letterSpacing: 0.5,
              boxShadow: '0 2px 8px rgba(59,130,246,0.08)',
              marginRight: 8
            }}>
              {credits !== null ? `Credits: ${credits}/${maxCredits}` : 'Loading credits...'}
            </span>
            <div style={{ width: 120, height: 10, background: '#e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ width: `${percent}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)', transition: 'width 0.3s' }} />
            </div>
          </div>
          <button
            style={{
              background: 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '0.6rem 1.7rem',
              fontWeight: 700,
              fontSize: '1.08rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(59,130,246,0.08)',
              marginLeft: 16
            }}
            onClick={() => navigate('/pricing')}
          >
            Upgrade
          </button>
        </div>
        {outOfCredits && (
          <div style={{ color: 'red', marginBottom: 24, fontWeight: 600 }}>
            You have no credits remaining. Please upgrade your plan or wait for your credits to reset.
          </div>
        )}
        {!repairData ? (
          <InputForm onSubmit={handleSubmit} isLoading={isLoading} disabled={outOfCredits} />
        ) : (
          <RepairGuide repairData={repairData} />
        )}
      </div>
    </SubscriptionGate>
  );
}

export default RepairPage; 