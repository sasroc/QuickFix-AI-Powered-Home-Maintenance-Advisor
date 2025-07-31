import React, { useState, useEffect, useRef } from 'react';
import InputForm from '../forms/InputForm';
import RepairGuide from './RepairGuide';
import { analyzeRepairIssue } from '../../services/aiService';
import SubscriptionGate from '../auth/SubscriptionGate';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getFirestore, doc, onSnapshot, collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { PLAN_CREDITS, PLAN_HISTORY_CAPS } from '../../constants/plans';
import { hasLifetimeAccess, getEffectivePlan } from '../../utils/trialUtils';
import useAnalytics from '../../hooks/useAnalytics';
import './RepairPage.css';

const db = getFirestore();

function RepairPage() {
  const [repairData, setRepairData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [credits, setCredits] = useState(null);
  const [plan, setPlan] = useState('none');
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const { currentUser } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();
  const repairPageRef = useRef(null);

  const handleCloseError = () => {
    setError(null);
  };

  const handleBack = () => {
    setRepairData(null);
    setError(null);
  };

  useEffect(() => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    const unsub = onSnapshot(userRef, async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        
        // Auto-allocate credits for new lifetime users (only when credits are null/undefined, not 0)
        if (hasLifetimeAccess(data) && (data.credits === null || data.credits === undefined)) {
          try {
            await updateDoc(userRef, {
              credits: 25,
              plan: 'starter',
              lastCreditReset: serverTimestamp()
            });
            // Don't update local state here - let the snapshot update handle it
            return;
          } catch (error) {
            console.error('Failed to auto-allocate credits for lifetime user:', error);
          }
        }
        
        // Auto-reset credits for lifetime users if monthly reset is due
        if (hasLifetimeAccess(data) && data.credits !== null && data.credits !== undefined) {
          const isEligibleForReset = checkMonthlyResetEligibility(data.lastCreditReset);
          if (isEligibleForReset) {
            try {
              await updateDoc(userRef, {
                credits: 25,
                plan: 'starter',
                lastCreditReset: serverTimestamp()
              });
              // Don't update local state here - let the snapshot update handle it
              return;
            } catch (error) {
              console.error('Failed to auto-reset monthly credits for lifetime user:', error);
            }
          }
        }
        
        // Auto-reset credits for annual subscribers if monthly reset is due
        if (!hasLifetimeAccess(data) && 
            data.subscriptionStatus === 'active' && 
            data.billingInterval === 'annual' &&
            data.credits !== null && data.credits !== undefined) {
          const isEligibleForReset = checkMonthlyResetEligibility(data.lastCreditReset);
          if (isEligibleForReset) {
            try {
              // Get credit allocation for user's plan
              const effectivePlan = getEffectivePlan(data);
              const PLAN_CREDITS_MAP = {
                'starter': 10,
                'pro': 25,
                'premium': 100
              };
              const creditsToReset = PLAN_CREDITS_MAP[effectivePlan] || 10;
              
              console.log(`Auto-resetting monthly credits for annual ${effectivePlan} subscriber`);
              await updateDoc(userRef, {
                credits: creditsToReset,
                lastCreditReset: serverTimestamp()
              });
              // Don't update local state here - let the snapshot update handle it
              return;
            } catch (error) {
              console.error('Failed to auto-reset monthly credits for annual subscriber:', error);
            }
          }
        }
        
        setCredits(data.credits);
        setPlan(getEffectivePlan(data)); // Use effective plan (considers lifetime access)
        setUserData(data);
      }
    });
    return unsub;
  }, [currentUser]);

  // Helper function to check if user is eligible for monthly credit reset
  const checkMonthlyResetEligibility = (lastCreditReset) => {
    // If no lastCreditReset exists, user is eligible
    if (!lastCreditReset) {
      return true;
    }
    
    const now = new Date();
    let lastReset;
    
    // Handle Firestore timestamp
    if (lastCreditReset.toDate) {
      lastReset = lastCreditReset.toDate();
    } else if (lastCreditReset instanceof Date) {
      lastReset = lastCreditReset;
    } else {
      // String or number timestamp
      lastReset = new Date(lastCreditReset);
    }
    
    // Calculate the difference in days
    const daysDifference = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
    
    // Eligible if at least 30 days have passed since last reset
    return daysDifference >= 30;
  };

  // Scroll to top when repair guide is displayed
  useEffect(() => {
    if (repairData) {
      // Use a longer delay to ensure all animations and rendering are complete
      setTimeout(() => {
        // Try multiple scroll methods for maximum compatibility
        if (repairPageRef.current) {
          repairPageRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        } else {
          // Fallback to window scroll
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        
        // Additional fallback for edge cases
        setTimeout(() => {
          if (window.scrollY > 0) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }, 100);
      }, 300);
    }
  }, [repairData]);

  // Helper function to compress image
  const compressImage = (base64String, maxWidth = 800, quality = 0.7) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.src = base64String;
    });
  };

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

      // Get auth token for API call
      let authToken = null;
      if (currentUser) {
        try {
          authToken = await currentUser.getIdToken();
        } catch (error) {
          console.warn('Failed to get auth token:', error);
        }
      }

      // Call the backend AI service
      const aiResponse = await analyzeRepairIssue({
        description: input.text,
        image: input.image,
        uid: currentUser?.uid,
        authToken
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
        imageAnalysis: input.image || null // Store the original image data
      };

      // Save repair data to Firestore only if history is not full
      if (currentUser && !historyFull) {
        try {
          // Compress image if it exists
          let compressedImage = null;
          if (input.image) {
            compressedImage = await compressImage(input.image);
          }

          const repairData = {
            userId: currentUser.uid,
            title: mappedResponse.title,
            steps: mappedResponse.steps,
            tools: mappedResponse.tools,
            materials: mappedResponse.materials,
            estimatedTime: mappedResponse.estimatedTime,
            imageAnalysis: compressedImage, // Use compressed image
            timestamp: serverTimestamp()
          };
          await addDoc(repairsRef, repairData);
          
          // Track repair saved to history
          trackEvent('repair_saved_to_history', {
            plan: plan,
            history_count: currentHistoryCount + 1
          });
        } catch (firestoreError) {
          console.error('Failed to save to Firestore:', firestoreError);
          // Don't throw error - still show the repair guide
          setError('Repair guide generated successfully, but failed to save to history. You can still use this guide now.');
        }
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
  const effectivePlan = getEffectivePlan(userData);
  const maxCredits = PLAN_CREDITS[effectivePlan] || 25;
  const percent = credits !== null ? Math.max(0, Math.min(100, Math.round((credits / maxCredits) * 100))) : 100;

  return (
    <SubscriptionGate>
      <div className={`repair-page-container ${isDarkMode ? 'dark' : ''}`} ref={repairPageRef}>
        <div className="credits-container">
          <div className="credits-info">
            <span className="credits-badge">
              {credits !== null ? `Credits: ${credits}/${maxCredits}` : 'Loading credits...'}
            </span>
            {userData?.isOnTrial && (
              <span className="trial-indicator">
                🚀 Trial Active
              </span>
            )}
            {hasLifetimeAccess(userData) && (
              <span className="lifetime-indicator">
                ♾️ Lifetime Access
              </span>
            )}
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
            </div>
            <button
              className="upgrade-button"
              onClick={() => navigate('/pricing')}
              style={{ display: hasLifetimeAccess(userData) ? 'none' : 'block' }}
            >
              {userData?.isOnTrial ? 'Subscribe' : effectivePlan === 'starter' ? 'Upgrade' : 'Change plan'}
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
          <RepairGuide repairData={repairData} onBack={handleBack} />
        )}
      </div>
    </SubscriptionGate>
  );
}

export default RepairPage; 