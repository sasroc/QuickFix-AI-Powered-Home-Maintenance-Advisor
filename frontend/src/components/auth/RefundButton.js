import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const RefundButton = () => {
  const { currentUser } = useAuth();
  const { isDarkMode } = useTheme();
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const checkRefundEligibility = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/stripe/refund-eligibility/${currentUser.uid}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEligibility(data);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to check refund eligibility');
      }
    } catch (err) {
      console.error('Error checking refund eligibility:', err);
      setError('Failed to check refund eligibility');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    checkRefundEligibility();
  }, [checkRefundEligibility]);

  const processRefund = async () => {
    setProcessing(true);
    setError('');
    setMessage('');

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/stripe/refund`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ uid: currentUser.uid })
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(`Refund processed successfully! You will receive $${data.amount.toFixed(2)} back to your original payment method within 3-5 business days.`);
        setShowConfirmation(false);
        // Refresh eligibility to show that refund was processed
        setTimeout(() => {
          checkRefundEligibility();
        }, 1000);
      } else {
        setError(data.message || 'Failed to process refund');
      }
    } catch (err) {
      console.error('Error processing refund:', err);
      setError('Failed to process refund');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="refund-loading">Checking refund eligibility...</div>;
  }

  if (!eligibility) {
    return null;
  }

  if (!eligibility.eligible) {
    return (
      <div className={`refund-info ${isDarkMode ? 'dark' : ''}`}>
        <div className="refund-status not-eligible">
          <h4>Refund Not Available</h4>
          <p>{eligibility.reason}</p>
          {eligibility.hoursSinceCreation && (
            <small>
              Subscription created {eligibility.hoursSinceCreation} hours ago 
              {eligibility.creditsUsed > 0 && ` • ${eligibility.creditsUsed} credits used`}
            </small>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`refund-container ${isDarkMode ? 'dark' : ''}`}>
      <div className="refund-eligible">
        <h4>✅ Refund Available</h4>
        <p>You're eligible for a full refund within our 24-hour no-questions-asked policy.</p>
        <div className="refund-details">
          <small>
            • Subscription created {eligibility.hoursSinceCreation} hours ago<br/>
            • {eligibility.remainingHours} hours remaining for refund<br/>
            • No credits used ({eligibility.remainingCredits} credits remaining)
          </small>
        </div>
        
        {!showConfirmation ? (
          <button 
            className="refund-button"
            onClick={() => setShowConfirmation(true)}
            disabled={processing}
          >
            Request Refund
          </button>
        ) : (
          <div className="refund-confirmation">
            <div className="confirmation-warning">
              <h5>⚠️ Confirm Refund Request</h5>
              <p>This will:</p>
              <ul>
                <li>Cancel your subscription immediately</li>
                <li>Process a full refund to your original payment method</li>
                <li>Downgrade your account to the free tier</li>
                <li>Remove access to all premium features</li>
              </ul>
              <p><strong>This action cannot be undone.</strong></p>
            </div>
            <div className="confirmation-buttons">
              <button 
                className="confirm-refund-button"
                onClick={processRefund}
                disabled={processing}
              >
                {processing ? 'Processing...' : 'Yes, Process Refund'}
              </button>
              <button 
                className="cancel-refund-button"
                onClick={() => setShowConfirmation(false)}
                disabled={processing}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {message && (
        <div className="refund-success">
          {message}
        </div>
      )}

      {error && (
        <div className="refund-error">
          {error}
        </div>
      )}

      <style jsx>{`
        .refund-container {
          margin-top: 20px;
          padding: 20px;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          background: #f9f9f9;
          color: #333;
        }
        .refund-container.dark {
          background: #1a202c;
          border-color: #2d3748;
          color: #e2e8f0;
        }
        .refund-eligible h4 {
          color: #28a745;
          margin: 0 0 10px 0;
        }
        .refund-container.dark .refund-eligible h4 {
          color: #68d391;
        }
        .refund-eligible p {
          color: inherit;
          margin-bottom: 15px;
        }
        .refund-details {
          margin: 15px 0;
          padding: 12px;
          background: #e8f5e8;
          border-radius: 6px;
          font-size: 0.9em;
          border: 1px solid #c3e6cb;
        }
        .refund-container.dark .refund-details {
          background: #1a2f1a;
          border-color: #2d5a2f;
          color: #c6f6d5;
        }
        .refund-button {
          background: #dc3545;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.95em;
          transition: all 0.2s ease;
        }
        .refund-button:hover:not(:disabled) {
          background: #c82333;
          transform: translateY(-1px);
        }
        .refund-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .refund-confirmation {
          margin-top: 15px;
        }
        .confirmation-warning {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          padding: 18px;
          border-radius: 8px;
          margin-bottom: 15px;
        }
        .refund-container.dark .confirmation-warning {
          background: #2d1b0e;
          border-color: #975a16;
          color: #fbd38d;
        }
        .confirmation-warning h5 {
          margin: 0 0 12px 0;
          color: #856404;
          font-size: 1.1em;
        }
        .refund-container.dark .confirmation-warning h5 {
          color: #fbd38d;
        }
        .confirmation-warning p {
          margin: 8px 0;
          line-height: 1.5;
        }
        .confirmation-warning ul {
          margin: 12px 0;
          padding-left: 20px;
          line-height: 1.6;
        }
        .refund-container.dark .confirmation-warning ul li {
          color: #fbd38d;
        }
        .confirmation-buttons {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .confirm-refund-button {
          background: #dc3545;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
          font-size: 0.95em;
        }
        .confirm-refund-button:hover:not(:disabled) {
          background: #c82333;
          transform: translateY(-1px);
        }
        .cancel-refund-button {
          background: #6c757d;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.95em;
        }
        .cancel-refund-button:hover:not(:disabled) {
          background: #5a6268;
          transform: translateY(-1px);
        }
        .refund-container.dark .cancel-refund-button {
          background: #4a5568;
          color: #e2e8f0;
        }
        .refund-container.dark .cancel-refund-button:hover:not(:disabled) {
          background: #2d3748;
        }
        .confirm-refund-button:disabled,
        .cancel-refund-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .refund-success {
          margin-top: 15px;
          padding: 16px;
          background: #d4edda;
          border: 1px solid #c3e6cb;
          border-radius: 8px;
          color: #155724;
          border-left: 4px solid #28a745;
        }
        .refund-container.dark .refund-success {
          background: #1a2f1a;
          border-color: #2d5a2f;
          color: #c6f6d5;
          border-left-color: #68d391;
        }
        .refund-error {
          margin-top: 15px;
          padding: 16px;
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 8px;
          color: #721c24;
          border-left: 4px solid #dc3545;
        }
        .refund-container.dark .refund-error {
          background: #2d1a1a;
          border-color: #5a2d2f;
          color: #feb2b2;
          border-left-color: #fc8181;
        }
        .refund-info {
          margin-top: 20px;
          padding: 16px;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          background: #f8f9fa;
          color: #495057;
        }
        .refund-info.dark {
          background: #1a202c;
          border-color: #2d3748;
          color: #a0aec0;
        }
        .refund-status.not-eligible h4 {
          color: #6c757d;
          margin: 0 0 10px 0;
        }
        .refund-info.dark .refund-status.not-eligible h4 {
          color: #a0aec0;
        }
        .refund-loading {
          padding: 15px;
          text-align: center;
          color: #6c757d;
        }
        .refund-container.dark .refund-loading {
          color: #a0aec0;
        }
        
        /* Mobile responsiveness */
        @media (max-width: 480px) {
          .refund-container {
            padding: 16px;
            margin-top: 16px;
          }
          .confirmation-buttons {
            flex-direction: column;
          }
          .confirm-refund-button,
          .cancel-refund-button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default RefundButton; 