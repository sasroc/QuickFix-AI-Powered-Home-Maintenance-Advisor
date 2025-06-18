import React, { useState } from 'react';
import { FaQuestionCircle } from 'react-icons/fa';
import ContactForm from '../contact/ContactForm';
import './HelpButton.css';

const HelpButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        className="help-button"
        onClick={() => setIsOpen(true)}
        aria-label="Get Help"
      >
        <FaQuestionCircle />
        <span>Help</span>
      </button>

      {isOpen && (
        <div className="help-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="help-modal" onClick={e => e.stopPropagation()}>
            <button 
              className="close-button"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
            
            <div className="help-content">
              <h2>How can we help?</h2>
              <p>Our support team is here to assist you with any questions or concerns.</p>
              
              <div className="help-options">
                <div className="help-option">
                  <h3>Quick Help</h3>
                  <p>Check our FAQ for quick answers to common questions.</p>
                  <a href="/faq" className="help-link">View FAQ</a>
                </div>
                
                <div className="help-option">
                  <h3>Contact Support</h3>
                  <p>Need more help? Send us a message and we'll get back to you.</p>
                  <ContactForm />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HelpButton; 