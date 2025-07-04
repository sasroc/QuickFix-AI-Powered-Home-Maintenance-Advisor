import React, { useState, useEffect } from 'react';
import { getTrialTimeRemaining, formatTrialTimeRemaining } from '../../utils/trialUtils';
import './TrialStatus.css';

const TrialStatus = ({ userData, showDetailed = false, className = '' }) => {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [mounted, setMounted] = useState(true);

  // Update countdown frequently and respond to userData changes
  useEffect(() => {
    const updateCountdown = () => {
      if (mounted && userData?.isOnTrial) {
        setTimeRemaining(getTrialTimeRemaining(userData));
      }
    };

    // Initial update
    updateCountdown();

    // Update every 10 seconds for more responsive updates
    const interval = setInterval(updateCountdown, 10000);

    return () => {
      setMounted(false);
      clearInterval(interval);
    };
  }, [userData, mounted]);

  // Also update immediately when userData changes
  useEffect(() => {
    if (userData?.isOnTrial) {
      setTimeRemaining(getTrialTimeRemaining(userData));
    }
  }, [userData]);

  // Don't render if user is not on trial
  if (!userData?.isOnTrial || !timeRemaining) {
    return null;
  }

  const isUrgent = timeRemaining.totalHours <= 24; // Less than 24 hours remaining
  const isCritical = timeRemaining.totalHours <= 6; // Less than 6 hours remaining

  return (
    <div className={`trial-status ${className} ${isUrgent ? 'urgent' : ''} ${isCritical ? 'critical' : ''}`}>
      <div className="trial-status-content">
        <div className="trial-icon">
          {isCritical ? '⏰' : isUrgent ? '⚠️' : '🚀'}
        </div>
        <div className="trial-info">
          <div className="trial-title">
            {isCritical ? 'Trial Ending Soon!' : isUrgent ? 'Trial Ending Tomorrow' : 'Free Trial Active'}
          </div>
          <div className="trial-countdown">
            {showDetailed && timeRemaining.days > 0 ? (
              <span>
                <strong>{timeRemaining.days}</strong> day{timeRemaining.days > 1 ? 's' : ''}
                {timeRemaining.hours > 0 && (
                  <>, <strong>{timeRemaining.hours}</strong> hour{timeRemaining.hours > 1 ? 's' : ''}</>
                )} remaining
              </span>
            ) : (
              <span>{formatTrialTimeRemaining(userData)}</span>
            )}
          </div>
          {showDetailed && (
            <div className="trial-details">
              <small>
                Trial ends on {timeRemaining.endDate?.toLocaleDateString()} at{' '}
                {timeRemaining.endDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </small>
            </div>
          )}
        </div>
      </div>
      {(isUrgent || isCritical) && (
        <div className="trial-cta">
          <a href="/pricing" className="upgrade-link">
            Subscribe Now
          </a>
        </div>
      )}
    </div>
  );
};

export default TrialStatus; 