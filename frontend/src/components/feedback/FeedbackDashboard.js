import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FaBug, FaLightbulb, FaComments, FaEye, FaCheck, FaTimes, FaTrash } from 'react-icons/fa';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { apiRequest } from '../../services/apiConfig';
import './FeedbackDashboard.css';

const FeedbackDashboard = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    priority: ''
  });
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [responseText, setResponseText] = useState('');
  const { isDarkMode } = useTheme();
  const { currentUser } = useAuth();

  const fetchFeedback = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const token = await currentUser.getIdToken();
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);
      if (filters.priority) params.append('priority', filters.priority);

      const response = await apiRequest(`api/feedback?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      setFeedback(data.feedback);
    } catch (err) {
      setError('Failed to load feedback');
      console.error('Error fetching feedback:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, currentUser]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const updateStatus = async (feedbackId, status, responseText = '') => {
    if (!currentUser) return;

    try {
      const token = await currentUser.getIdToken();
      await apiRequest(`api/feedback/${feedbackId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, response: responseText })
      });

      // Update the local state to reflect the change immediately
      setFeedback(prevFeedback => 
        prevFeedback.map(item => 
          item.id === feedbackId ? { ...item, status: status } : item
        )
      );

      if (selectedFeedback && selectedFeedback.id === feedbackId) {
        setSelectedFeedback(prev => prev ? { ...prev, status: status } : null);
      }
      
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status. Please try again.');
    }
  };

  const handleDeleteClick = (feedbackId) => {
    setSelectedFeedback(null);
    setShowDeleteConfirm(feedbackId);
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirm || !currentUser) return;
    const feedbackId = showDeleteConfirm;

    try {
      const token = await currentUser.getIdToken();
      await apiRequest(`api/feedback/${feedbackId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Update UI
      setFeedback(prev => prev.filter(item => item.id !== feedbackId));
      setShowDeleteConfirm(null);

    } catch (err) {
      console.error('Error deleting feedback:', err);
      setError('Failed to delete feedback. Please try again.');
      setShowDeleteConfirm(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  const handleResolve = () => {
    if (!selectedFeedback) return;
    updateStatus(selectedFeedback.id, 'resolved', responseText);
    setSelectedFeedback(null);
    setResponseText('');
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'bug': return <FaBug className="type-icon bug" />;
      case 'feature': return <FaLightbulb className="type-icon feature" />;
      case 'general': return <FaComments className="type-icon general" />;
      default: return <FaComments className="type-icon general" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return '#3b82f6';
      case 'in_progress': return '#f59e0b';
      case 'resolved': return '#10b981';
      case 'closed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      case 'critical': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className={`feedback-dashboard ${isDarkMode ? 'dark' : ''}`}>
        <div className="loading">Loading feedback...</div>
      </div>
    );
  }

  return (
    <div className={`feedback-dashboard ${isDarkMode ? 'dark' : ''}`}>
      <div className="dashboard-header">
        <h1>Feedback Dashboard</h1>
        <button onClick={fetchFeedback} className="refresh-button">
          Refresh
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="filters">
        <div className="filter-group">
          <label>Status:</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="">All</option>
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Type:</label>
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
          >
            <option value="">All</option>
            <option value="bug">Bug</option>
            <option value="feature">Feature</option>
            <option value="general">General</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Priority:</label>
          <select
            value={filters.priority}
            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
          >
            <option value="">All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Feedback List */}
      <div className="feedback-list">
        {feedback.length === 0 ? (
          <div className="empty-state">
            <p>No feedback found matching your filters.</p>
          </div>
        ) : (
          feedback.map((item) => (
            <motion.div
              key={item.id}
              className="feedback-item"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="feedback-header">
                <div className="feedback-meta">
                  {getTypeIcon(item.type)}
                  <div className="feedback-info">
                    <h3>{item.title}</h3>
                    <p className="feedback-email">{item.email}</p>
                  </div>
                </div>
                <div className="feedback-status">
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(item.status) }}
                  >
                    {item.status.replace('_', ' ')}
                  </span>
                  <span
                    className="priority-badge"
                    style={{ backgroundColor: getPriorityColor(item.priority) }}
                  >
                    {item.priority}
                  </span>
                </div>
              </div>

              <div className="feedback-content">
                <p className="feedback-description">{item.description}</p>
                {item.screenshots && item.screenshots.length > 0 && (
                  <div className="screenshots-count">
                    📷 {item.screenshots.length} screenshot(s)
                  </div>
                )}
              </div>

              <div className="feedback-footer">
                <span className="feedback-date">{formatDate(item.createdAt)}</span>
                <div className="feedback-actions">
                  <button
                    className="action-button view"
                    onClick={() => setSelectedFeedback(item)}
                  >
                    <FaEye />
                    View Details
                  </button>
                  <button
                    className="action-button delete"
                    onClick={() => handleDeleteClick(item.id)}
                  >
                    <FaTrash />
                    Delete
                  </button>
                  {item.status === 'new' && (
                    <>
                      <button
                        className="action-button progress"
                        onClick={() => updateStatus(item.id, 'in_progress')}
                      >
                        <FaCheck />
                        Start Progress
                      </button>
                      <button
                        className="action-button resolve"
                        onClick={() => updateStatus(item.id, 'resolved')}
                      >
                        <FaCheck />
                        Resolve
                      </button>
                    </>
                  )}
                  {item.status === 'in_progress' && (
                    <button
                      className="action-button resolve"
                      onClick={() => updateStatus(item.id, 'resolved')}
                    >
                      <FaCheck />
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <div className="modal-overlay" onClick={() => setSelectedFeedback(null)}>
          <div 
            className={`feedback-detail-modal ${isDarkMode ? 'dark' : ''}`} 
            onClick={(e) => e.stopPropagation()}
            style={isDarkMode ? { backgroundColor: '#374151', color: 'white' } : {}}
          >
            <div className="modal-header">
              <h2>{selectedFeedback.title}</h2>
              <button
                className="close-button"
                onClick={() => setSelectedFeedback(null)}
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-content">
              <div className="detail-section">
                <h3>Details</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Type:</label>
                    <span>{selectedFeedback.type}</span>
                  </div>
                  <div className="detail-item">
                    <label>Status:</label>
                    <span>{selectedFeedback.status}</span>
                  </div>
                  <div className="detail-item">
                    <label>Priority:</label>
                    <span>{selectedFeedback.priority}</span>
                  </div>
                  <div className="detail-item">
                    <label>Category:</label>
                    <span>{selectedFeedback.category || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>From:</label>
                    <span>{selectedFeedback.email}</span>
                  </div>
                  <div className="detail-item">
                    <label>Date:</label>
                    <span>{formatDate(selectedFeedback.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Description</h3>
                <p>{selectedFeedback.description}</p>
              </div>

              {selectedFeedback.type === 'bug' && (
                <>
                  {selectedFeedback.steps && (
                    <div className="detail-section">
                      <h3>Steps to Reproduce</h3>
                      <p>{selectedFeedback.steps}</p>
                    </div>
                  )}
                  {selectedFeedback.expected && (
                    <div className="detail-section">
                      <h3>Expected Behavior</h3>
                      <p>{selectedFeedback.expected}</p>
                    </div>
                  )}
                  {selectedFeedback.actual && (
                    <div className="detail-section">
                      <h3>Actual Behavior</h3>
                      <p>{selectedFeedback.actual}</p>
                    </div>
                  )}
                </>
              )}

              {selectedFeedback.screenshots && selectedFeedback.screenshots.length > 0 && (
                <div className="detail-section">
                  <h3>Screenshots</h3>
                  <div className="screenshots-grid">
                    {selectedFeedback.screenshots.map((screenshot, index) => (
                      <img
                        key={index}
                        src={screenshot}
                        alt={`Screenshot ${index + 1}`}
                        className="screenshot"
                      />
                    ))}
                  </div>
                </div>
              )}

              {selectedFeedback.response && (
                <div className="detail-section">
                  <h3>Response</h3>
                  <p>{selectedFeedback.response}</p>
                </div>
              )}

              {/* Response Input */}
              {selectedFeedback.status !== 'resolved' && selectedFeedback.status !== 'closed' && (
                <div className="detail-section">
                  <h3>Response</h3>
                  <textarea
                    className="response-textarea"
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Type your response to the user..."
                    rows={4}
                  ></textarea>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button
                className="cancel-button"
                onClick={() => setSelectedFeedback(null)}
              >
                Close
              </button>
              {selectedFeedback.status !== 'resolved' && selectedFeedback.status !== 'closed' && (
                <button
                  className="resolve-button"
                  onClick={handleResolve}
                >
                  Mark as Resolved & Send Response
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <motion.div 
            className={`feedback-detail-modal ${isDarkMode ? 'dark' : ''}`} 
            onClick={(e) => e.stopPropagation()}
            style={isDarkMode ? { backgroundColor: '#374151', color: 'white' } : {}}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="modal-header">
              <h2>Confirm Deletion</h2>
              <button className="close-button" onClick={cancelDelete}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-content">
              <p>Are you sure you want to permanently delete this feedback? This action cannot be undone.</p>
            </div>
            <div className="modal-actions" style={{ justifyContent: 'flex-end' }}>
              <button className="cancel-button" onClick={cancelDelete}>
                Cancel
              </button>
              <button className="delete-button" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default FeedbackDashboard; 