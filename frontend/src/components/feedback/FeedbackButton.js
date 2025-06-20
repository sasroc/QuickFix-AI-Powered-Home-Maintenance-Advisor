import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBug, FaLightbulb, FaComments, FaTimes } from 'react-icons/fa';
import { useTheme } from '../../contexts/ThemeContext';
import FeedbackModal from './FeedbackModal';
import './FeedbackButton.css';

const FeedbackButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState(null);
  const { isDarkMode } = useTheme();

  const handleFeedbackType = (type) => {
    setFeedbackType(type);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setFeedbackType(null);
  };

  return (
    <>
      {/* Feedback Button */}
      <div className="feedback-button-container">
        <motion.button
          className="feedback-button"
          onClick={() => setIsOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Submit Feedback"
        >
          <FaComments />
          <span>Feedback</span>
        </motion.button>
      </div>

      {/* Feedback Modal */}
      {ReactDOM.createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="feedback-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              onClick={handleClose}
            >
              <motion.div
                className={`feedback-modal ${isDarkMode ? 'dark' : ''}`}
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.98, opacity: 0 }}
                transition={{ duration: 0.1, ease: 'easeOut' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="feedback-header">
                  <h2>How can we help?</h2>
                  <button className="close-button" onClick={handleClose}>
                    <FaTimes />
                  </button>
                </div>

                <div className="feedback-options">
                  <motion.button
                    className="feedback-option"
                    onClick={() => handleFeedbackType('bug')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="option-icon bug">
                      <FaBug />
                    </div>
                    <div className="option-content">
                      <h3>Report a Bug</h3>
                      <p>Found an issue? Let us know so we can fix it.</p>
                    </div>
                  </motion.button>

                  <motion.button
                    className="feedback-option"
                    onClick={() => handleFeedbackType('feature')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="option-icon feature">
                      <FaLightbulb />
                    </div>
                    <div className="option-content">
                      <h3>Feature Request</h3>
                      <p>Have an idea? We'd love to hear your suggestions.</p>
                    </div>
                  </motion.button>

                  <motion.button
                    className="feedback-option"
                    onClick={() => handleFeedbackType('general')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="option-icon general">
                      <FaComments />
                    </div>
                    <div className="option-content">
                      <h3>General Feedback</h3>
                      <p>Share your thoughts about QuickFixAI.</p>
                    </div>
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Feedback Form Modal */}
      <AnimatePresence>
        {feedbackType && (
          <FeedbackModal
            type={feedbackType}
            onClose={handleClose}
            isDarkMode={isDarkMode}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default FeedbackButton; 