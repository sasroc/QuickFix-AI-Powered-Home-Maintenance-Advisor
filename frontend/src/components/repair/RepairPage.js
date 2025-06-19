import React, { useState, useEffect } from 'react';
import InputForm from '../forms/InputForm';
import RepairGuide from './RepairGuide';
import { analyzeRepairIssue } from '../../services/aiService';
import SubscriptionGate from '../auth/SubscriptionGate';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getFirestore, doc, onSnapshot, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { PLAN_CREDITS, PLAN_HISTORY_CAPS } from '../../constants/plans';
import useAnalytics from '../../hooks/useAnalytics';
import './RepairPage.css';

const db = getFirestore();

function RepairPage() {
  const [repairData, setRepairData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [credits, setCredits] = useState(null);
  const [plan, setPlan] = useState('starter');
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();

  const handleCloseError = () => {
    setError(null);
  };

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
    setError(null);
    try {
      // Track repair request
      trackEvent('repair_request', {
        has_image: !!input.image,
        plan: plan,
        remaining_credits: credits
      });

      // Check repair history cap
      const repairsRef = collection(db, 'repairs');
      const q = query(repairsRef, where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const currentHistoryCount = querySnapshot.size;
      const historyCap = PLAN_HISTORY_CAPS[plan];
      const historyFull = currentHistoryCount >= historyCap;

      if (historyFull) {
        setError(`Note: This repair guide won't be saved to your history as you've reached the maximum number of repair histories (${historyCap}) for your ${plan} plan. You can still view and use this guide now.`);
      }

      // Call the backend AI service
      const aiResponse = await analyzeRepairIssue({
        description: input.text,
        image: input.image,
        uid: currentUser?.uid
      });

      // Track successful repair analysis
      trackEvent('repair_analysis_complete', {
        has_steps: aiResponse.steps?.length > 0,
        has_tools: aiResponse.tools?.length > 0,
        has_materials: aiResponse.materials?.length > 0,
        confidence_score: aiResponse.confidenceScore,
        estimated_time: aiResponse.estimatedTime
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

      // Save repair data to Firestore only if history is not full
      if (currentUser && !historyFull) {
        const repairData = {
          userId: currentUser.uid,
          title: mappedResponse.title,
          steps: mappedResponse.steps,
          tools: mappedResponse.tools,
          materials: mappedResponse.materials,
          estimatedTime: mappedResponse.estimatedTime,
          imageAnalysis: mappedResponse.imageAnalysis,
          timestamp: serverTimestamp()
        };
        await addDoc(repairsRef, repairData);
        
        // Track repair saved to history
        trackEvent('repair_saved_to_history', {
          plan: plan,
          history_count: currentHistoryCount + 1
        });
      }

      setRepairData(mappedResponse);
    } catch (error) {
      console.error('Error processing repair request:', error);
      setError('An error occurred while processing your repair request. Please try again.');
      
      // Track repair error
      trackEvent('repair_error', {
        error_message: error.message,
        plan: plan
      });
    } finally {
      setIsLoading(false);
    }
  };

  const outOfCredits = credits !== null && credits <= 0;
  const maxCredits = PLAN_CREDITS[plan] || 50;
  const percent = credits !== null ? Math.max(0, Math.min(100, Math.round((credits / maxCredits) * 100))) : 100;

  return (
    <SubscriptionGate>
      <div className={`repair-page-container ${isDarkMode ? 'dark' : ''}`}>
        <div className="credits-container">
          <div className="credits-info">
            <span className="credits-badge">
              {credits !== null ? `Credits: ${credits}/${maxCredits}` : 'Loading credits...'}
            </span>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
            </div>
            <button
              className="upgrade-button"
              onClick={() => navigate('/pricing')}
            >
              {plan === 'starter' ? 'Upgrade' : 'Change plan'}
            </button>
          </div>
          <button
            className="history-button"
            onClick={() => navigate('/repair/history')}
          >
            Repair History
          </button>
        </div>
        {error && (
          <div className="error-message">
            <div className="error-text">{error}</div>
            <button className="error-close-button" onClick={handleCloseError}>×</button>
          </div>
        )}
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