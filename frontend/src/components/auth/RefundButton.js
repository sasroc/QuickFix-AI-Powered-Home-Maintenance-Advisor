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
        }
        .refund-container.dark {
          background: #2d3748;
          border-color: #4a5568;
        }
        .refund-eligible h4 {
          color: #28a745;
          margin: 0 0 10px 0;
        }
        .refund-details {
          margin: 15px 0;
          padding: 10px;
          background: #e8f5e8;
          border-radius: 4px;
          font-size: 0.9em;
        }
        .refund-container.dark .refund-details {
          background: #1a2e1a;
        }
        .refund-button {
          background: #dc3545;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
        }
        .refund-button:hover:not(:disabled) {
          background: #c82333;
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
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 15px;
        }
        .refund-container.dark .confirmation-warning {
          background: #3d2914;
          border-color: #8b6914;
        }
        .confirmation-warning h5 {
          margin: 0 0 10px 0;
          color: #856404;
        }
        .refund-container.dark .confirmation-warning h5 {
          color: #ffd700;
        }
        .confirmation-warning ul {
          margin: 10px 0;
          padding-left: 20px;
        }
        .confirmation-buttons {
          display: flex;
          gap: 10px;
        }
        .confirm-refund-button {
          background: #dc3545;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
        }
        .confirm-refund-button:hover:not(:disabled) {
          background: #c82333;
        }
        .cancel-refund-button {
          background: #6c757d;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
        }
        .cancel-refund-button:hover:not(:disabled) {
          background: #5a6268;
        }
        .confirm-refund-button:disabled,
        .cancel-refund-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .refund-success {
          margin-top: 15px;
          padding: 15px;
          background: #d4edda;
          border: 1px solid #c3e6cb;
          border-radius: 4px;
          color: #155724;
        }
        .refund-container.dark .refund-success {
          background: #1e3d20;
          border-color: #2d5a2f;
          color: #a3d9a5;
        }
        .refund-error {
          margin-top: 15px;
          padding: 15px;
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 4px;
          color: #721c24;
        }
        .refund-container.dark .refund-error {
          background: #3d1e20;
          border-color: #5a2d2f;
          color: #d9a3a5;
        }
        .refund-info {
          margin-top: 20px;
          padding: 15px;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          background: #f8f9fa;
        }
        .refund-info.dark {
          background: #2d3748;
          border-color: #4a5568;
        }
        .refund-status.not-eligible h4 {
          color: #6c757d;
          margin: 0 0 10px 0;
        }
        .refund-loading {
          padding: 15px;
          text-align: center;
          color: #6c757d;
        }
      `}</style>
    </div>
  );
};

export default RefundButton; 