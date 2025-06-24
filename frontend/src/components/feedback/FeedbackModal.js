import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';
import { FaBug, FaLightbulb, FaComments, FaTimes, FaUpload, FaCheck } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import useAnalytics from '../../hooks/useAnalytics';
import { apiRequest } from '../../services/apiConfig';
import './FeedbackModal.css';

const FeedbackModal = ({ type, onClose, isDarkMode }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    email: '',
    priority: 'medium',
    category: '',
    steps: '',
    expected: '',
    actual: ''
  });
  const [screenshots, setScreenshots] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const { trackEvent } = useAnalytics();
  const fileInputRef = useRef(null);

  // Set default email if user is logged in
  useEffect(() => {
    if (currentUser?.email) {
      setFormData(prev => ({ ...prev, email: currentUser.email }));
    }
  }, [currentUser]);

  const getTypeConfig = () => {
    switch (type) {
      case 'bug':
        return {
          icon: <FaBug />,
          title: 'Report a Bug',
          description: 'Help us improve by reporting any issues you encounter.',
          color: '#ef4444'
        };
      case 'feature':
        return {
          icon: <FaLightbulb />,
          title: 'Feature Request',
          description: 'Share your ideas for new features or improvements.',
          color: '#f59e0b'
        };
      case 'general':
        return {
          icon: <FaComments />,
          title: 'General Feedback',
          description: 'Share your thoughts about QuickFixAI.',
          color: '#10b981'
        };
      default:
        return {
          icon: <FaComments />,
          title: 'Feedback',
          description: 'Share your feedback with us.',
          color: '#3b82f6'
        };
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const compressImage = (file, maxSizeKB = 800) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 1200px width/height)
        let { width, height } = img;
        const maxDimension = 1200;
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        // Try different quality levels until we get under the size limit
        let quality = 0.8;
        let compressedFile = null;
        
        const tryCompress = () => {
          canvas.toBlob((blob) => {
            if (blob && blob.size <= maxSizeKB * 1024) {
              // Create a new File object from the blob
              compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else if (quality > 0.1) {
              quality -= 0.1;
              tryCompress();
            } else {
              // If we can't compress enough, return original file
              resolve(file);
            }
          }, 'image/jpeg', quality);
        };
        
        tryCompress();
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleScreenshotUpload = async (e) => {
    const files = Array.from(e.target.files);
    const maxFiles = 3;
    const maxFileSize = 5 * 1024 * 1024; // 5MB original file limit
    
    // Clear any previous errors
    setError('');
    
    // Check current screenshot count
    if (screenshots.length >= maxFiles) {
      setError(`Maximum ${maxFiles} screenshots allowed.`);
      return;
    }
    
    // Filter and process files
    const validFiles = [];
    const errors = [];
    
    for (const file of files) {
      if (file.size > maxFileSize) {
        errors.push(`"${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 5MB.`);
        continue;
      }
      
      if (!file.type.startsWith('image/')) {
        errors.push(`"${file.name}" is not an image file.`);
        continue;
      }
      
      validFiles.push(file);
    }
    
    // Show errors if any
    if (errors.length > 0) {
      setError(errors.join(' '));
    }
    
    // Limit total screenshots
    const remainingSlots = maxFiles - screenshots.length;
    const filesToProcess = validFiles.slice(0, remainingSlots);
    
    if (filesToProcess.length < validFiles.length) {
      setError(prev => prev + ` Only ${filesToProcess.length} screenshots added. Maximum ${maxFiles} total allowed.`);
    }
    
    // Process files (compress if needed)
    const processedScreenshots = [];
    for (const file of filesToProcess) {
      try {
        const compressedFile = await compressImage(file);
        processedScreenshots.push({
          file: compressedFile,
          id: Date.now() + Math.random(),
          preview: URL.createObjectURL(compressedFile),
          originalSize: file.size,
          compressedSize: compressedFile.size
        });
      } catch (error) {
        console.error('Error processing image:', error);
        errors.push(`Failed to process "${file.name}".`);
      }
    }
    
    if (processedScreenshots.length > 0) {
      setScreenshots(prev => [...prev, ...processedScreenshots]);
      
      // Show compression info if files were compressed
      const compressedFiles = processedScreenshots.filter(s => s.compressedSize < s.originalSize);
      if (compressedFiles.length > 0) {
        const savedSpace = compressedFiles.reduce((total, s) => total + (s.originalSize - s.compressedSize), 0);
        console.log(`Compressed ${compressedFiles.length} images, saved ${(savedSpace / 1024 / 1024).toFixed(1)}MB`);
      }
    }
  };

  const removeScreenshot = (id) => {
    setScreenshots(prev => {
      const filtered = prev.filter(s => s.id !== id);
      filtered.forEach(s => URL.revokeObjectURL(s.preview));
      return filtered;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Only clear error if it's not a file upload error
    if (!error.includes('screenshot') && !error.includes('image') && !error.includes('file')) {
      setError('');
    }

    try {
      // Track feedback submission
      trackEvent('feedback_submitted', {
        type: type,
        has_screenshots: screenshots.length > 0,
        user_id: currentUser?.uid
      });

      // Prepare form data
      const feedbackData = new FormData();
      feedbackData.append('type', type);
      feedbackData.append('title', formData.title);
      feedbackData.append('description', formData.description);
      feedbackData.append('email', formData.email);
      feedbackData.append('priority', formData.priority);
      feedbackData.append('category', formData.category);
      feedbackData.append('userId', currentUser?.uid || 'anonymous');
      feedbackData.append('userAgent', navigator.userAgent);
      feedbackData.append('url', window.location.href);
      feedbackData.append('timestamp', new Date().toISOString());

      // Add type-specific fields
      if (type === 'bug') {
        feedbackData.append('steps', formData.steps);
        feedbackData.append('expected', formData.expected);
        feedbackData.append('actual', formData.actual);
      }

      // Add screenshots
      screenshots.forEach((screenshot, index) => {
        feedbackData.append(`screenshots`, screenshot.file);
      });

      // Submit to backend
      const response = await apiRequest('/api/feedback/submit', {
        method: 'POST',
        body: feedbackData
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setIsSuccess(true);
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const config = getTypeConfig();

  if (isSuccess) {
    return ReactDOM.createPortal(
      <motion.div
        className="feedback-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.1 }}
        onClick={onClose}
      >
        <motion.div
          className={`feedback-modal success ${isDarkMode ? 'dark' : ''}`}
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.98, opacity: 0 }}
          transition={{ duration: 0.1, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="success-content">
            <div className="success-icon">
              <FaCheck />
            </div>
            <h2>Thank You!</h2>
            <p>Your feedback has been submitted successfully. We'll review it and get back to you soon.</p>
          </div>
        </motion.div>
      </motion.div>,
      document.body
    );
  }

  return ReactDOM.createPortal(
    <motion.div
      className="feedback-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1 }}
      onClick={onClose}
    >
      <motion.div
        className={`feedback-modal ${isDarkMode ? 'dark' : ''}`}
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.1, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '600px' }}
      >
        <div className="feedback-header">
          <div className="header-content">
            <div className="type-icon" style={{ backgroundColor: config.color }}>
              {config.icon}
            </div>
            <div>
              <h2>{config.title}</h2>
              <p>{config.description}</p>
            </div>
          </div>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="feedback-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder={type === 'bug' ? 'Brief description of the bug' : 'Brief description of your feedback'}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                placeholder="Please provide detailed information..."
              />
            </div>
          </div>

          {type === 'bug' && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="steps">Steps to Reproduce</label>
                  <textarea
                    id="steps"
                    name="steps"
                    value={formData.steps}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..."
                  />
                </div>
              </div>

              <div className="form-row two-columns">
                <div className="form-group">
                  <label htmlFor="expected">Expected Behavior</label>
                  <textarea
                    id="expected"
                    name="expected"
                    value={formData.expected}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="What should happen?"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="actual">Actual Behavior</label>
                  <textarea
                    id="actual"
                    name="actual"
                    value={formData.actual}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="What actually happened?"
                  />
                </div>
              </div>
            </>
          )}

          <div className="form-row two-columns">
            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
              >
                <option value="">Select category</option>
                {type === 'bug' && (
                  <>
                    <option value="ui">User Interface</option>
                    <option value="functionality">Functionality</option>
                    <option value="performance">Performance</option>
                    <option value="ai">AI Analysis</option>
                    <option value="payment">Payment/Billing</option>
                    <option value="other">Other</option>
                  </>
                )}
                {type === 'feature' && (
                  <>
                    <option value="ai">AI Features</option>
                    <option value="ui">User Interface</option>
                    <option value="mobile">Mobile App</option>
                    <option value="integration">Integrations</option>
                    <option value="other">Other</option>
                  </>
                )}
                {type === 'general' && (
                  <>
                    <option value="praise">Praise</option>
                    <option value="complaint">Complaint</option>
                    <option value="suggestion">Suggestion</option>
                    <option value="question">Question</option>
                    <option value="other">Other</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="Your email address"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Screenshots (Optional)</label>
              <div className="screenshot-upload">
                <button
                  type="button"
                  className="upload-button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FaUpload />
                  <span>Add Screenshots</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleScreenshotUpload}
                  style={{ display: 'none' }}
                />
                <p className="upload-hint">Upload images to help us understand the issue better (Max 3 files, up to 5MB each - images will be automatically compressed)</p>
              </div>
              
              {screenshots.length > 0 && (
                <div className="screenshots-preview">
                  {screenshots.map((screenshot) => (
                    <div key={screenshot.id} className="screenshot-item">
                      <img src={screenshot.preview} alt="Screenshot" />
                      <button
                        type="button"
                        className="remove-screenshot"
                        onClick={() => removeScreenshot(screenshot.id)}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>,
    document.body
  );
};

export default FeedbackModal; 