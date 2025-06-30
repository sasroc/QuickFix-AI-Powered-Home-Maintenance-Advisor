import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getFirestore, collection, query, where, orderBy, getDocs, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { PLAN_HISTORY_CAPS } from '../../constants/plans';
import TruncatedText from '../common/TruncatedText';
import './RepairHistory.css';

function RepairHistory() {
  const [repairHistory, setRepairHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [userPlan, setUserPlan] = useState('none');
  const { currentUser } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const db = getFirestore();

  // Helper function to check if imageAnalysis is a valid image URL
  const isValidImageUrl = (imageAnalysis) => {
    if (!imageAnalysis || typeof imageAnalysis !== 'string') return false;
    
    // Check if it's a valid URL
    try {
      const url = new URL(imageAnalysis);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const fetchUserPlan = useCallback(async () => {
    if (!currentUser) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        setUserPlan(userDoc.data().plan || 'none');
      }
    } catch (err) {
      console.error('Error fetching user plan:', err);
    }
  }, [currentUser, db]);

  const fetchRepairHistory = useCallback(async () => {
    if (!currentUser) return;
    try {
      setIsLoading(true);
      const repairsRef = collection(db, 'repairs');
      const q = query(
        repairsRef,
        where('userId', '==', currentUser.uid),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const repairsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRepairHistory(repairsList);
      setError(null);
    } catch (err) {
      console.error('Error fetching repair history:', err);
      if (err.message.includes('index')) {
        setError('Please wait while we set up your repair history. This may take a few minutes.');
      } else {
        setError('Failed to load repair history. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, db]);

  useEffect(() => {
    fetchUserPlan();
    fetchRepairHistory();
  }, [fetchUserPlan, fetchRepairHistory]);

  const handleRepairClick = (repair) => {
    navigate(`/repair/history/${repair.id}`, { state: { repairData: repair } });
  };

  const handleDeleteClick = (e, repairId) => {
    e.stopPropagation();
    setDeleteConfirmId(repairId);
  };

  const handleDeleteConfirm = async (e) => {
    e.stopPropagation();
    if (!deleteConfirmId) return;
    
    try {
      await deleteDoc(doc(db, 'repairs', deleteConfirmId));
      setRepairHistory(repairs => repairs.filter(repair => repair.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    } catch (err) {
      setError('Failed to delete repair. Please try again.');
      console.error('Error deleting repair:', err);
    }
  };

  const handleDeleteCancel = (e) => {
    e.stopPropagation();
    setDeleteConfirmId(null);
  };

  const historyCap = PLAN_HISTORY_CAPS[userPlan] || 10;
  const historyCount = repairHistory.length;
  const isAtCap = historyCount >= historyCap;

  if (isLoading) {
    return (
      <div className={`repair-history-container ${isDarkMode ? 'dark' : ''}`}>
        <div className="repair-history-header">
          <h1>Repair History</h1>
          <p>View and manage your past repairs</p>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading your repair history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`repair-history-container ${isDarkMode ? 'dark' : ''}`}>
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`repair-history-container ${isDarkMode ? 'dark' : ''}`}>
      <div className="repair-history-header">
        <div className="header-top-row">
          <button 
            className="back-button"
            onClick={() => navigate('/repair')}
            aria-label="Back to repair page"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Repair
          </button>
        </div>
        <h1>Repair History</h1>
        <p>View and manage your past repairs</p>
        <div className="history-stats">
          <span className="history-count">
            {historyCap === Infinity ? (
              `${historyCount} repair guides`
            ) : (
              `${historyCount} of ${historyCap} repair guides`
            )}
          </span>
        </div>
      </div>
      {isAtCap && (
        <div className="history-cap-message">
          You've reached your repair history limit. Upgrade your plan to store more repairs.
        </div>
      )}
      {repairHistory.length === 0 ? (
        <div className="no-history-message">
          <h2>No Repairs Found</h2>
          <p>Your repair history will appear here once you create your first repair.</p>
        </div>
      ) : (
        <div className="repair-history-list">
          {repairHistory.map((repair) => (
            <div
              key={repair.id}
              className="repair-history-card"
              onClick={() => handleRepairClick(repair)}
              role="button"
              tabIndex={0}
            >
              <div className="repair-history-card-header">
                <TruncatedText 
                  text={repair.title}
                  maxLength={120}
                  element="h3"
                  className="repair-title"
                />
                <p className="repair-date">
                  {repair.timestamp?.toDate().toLocaleDateString() || 'Date not available'}
                </p>
              </div>
              <div className="repair-history-card-content">
                <div className="repair-stats">
                  <div className="stat">
                    <span className="stat-label">Steps</span>
                    <span className="stat-value">{repair.steps?.length || 0}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Tools</span>
                    <span className="stat-value">{repair.tools?.length || 0}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Materials</span>
                    <span className="stat-value">{repair.materials?.length || 0}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Time</span>
                    <span className="stat-value">{repair.estimatedTime || 'N/A'}</span>
                  </div>
                </div>
                {isValidImageUrl(repair.imageAnalysis) && (
                  <div className="repair-image-preview">
                    <img src={repair.imageAnalysis} alt="Repair preview" />
                  </div>
                )}
                <div className="repair-history-card-actions">
                  {deleteConfirmId === repair.id ? (
                    <div className="delete-confirmation" onClick={e => e.stopPropagation()}>
                      <p>Delete this repair?</p>
                      <div className="delete-buttons">
                        <button 
                          className="confirm-delete"
                          onClick={handleDeleteConfirm}
                        >
                          Yes, Delete
                        </button>
                        <button 
                          className="cancel-delete"
                          onClick={handleDeleteCancel}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="delete-button"
                      onClick={(e) => handleDeleteClick(e, repair.id)}
                      aria-label="Delete repair"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RepairHistory; 