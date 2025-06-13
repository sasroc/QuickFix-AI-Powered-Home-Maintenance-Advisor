import React, { useState, useEffect } from 'react';
import InputForm from '../forms/InputForm';
import RepairGuide from './RepairGuide';
import { analyzeRepairIssue } from '../../services/aiService';
import SubscriptionGate from '../auth/SubscriptionGate';
import { useAuth } from '../../contexts/AuthContext';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './RepairPage.css';

const db = getFirestore();

// Plan credit limits for progress bar
const PLAN_CREDITS = {
  starter: 25,
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
      <div className="repair-page-container">
        <div className="credits-container">
          <div className="credits-info">
            <span className="credits-badge">
              {credits !== null ? `Credits: ${credits}/${maxCredits}` : 'Loading credits...'}
            </span>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
            </div>
          </div>
          <button
            className="upgrade-button"
            onClick={() => navigate('/pricing')}
          >
            {plan === 'starter' ? 'Upgrade' : 'Change plan'}
          </button>
        </div>
        {outOfCredits && (
          <div className="no-credits-message">
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