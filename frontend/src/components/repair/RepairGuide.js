import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './RepairGuide.css';

const RepairGuide = ({ repairData }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [showTools, setShowTools] = useState(true);

  // Calculate progress percentage
  const progress = (completedSteps.length / repairData.steps.length) * 100;

  const handleStepComplete = (stepIndex) => {
    if (completedSteps.includes(stepIndex)) {
      setCompletedSteps(completedSteps.filter(step => step !== stepIndex));
    } else {
      setCompletedSteps([...completedSteps, stepIndex]);
    }
  };

  const handleNextStep = () => {
    if (currentStep < repairData.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="repair-guide-container">
      <div className="repair-guide-header">
        <h2>{repairData.title}</h2>
        <div className="progress-bar">
          <motion.div
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="progress-text">{Math.round(progress)}% Complete</p>
      </div>

      <div className="repair-guide-content">
        <div className="steps-container">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="step-card"
            >
              <div className="step-header">
                <h3>Step {currentStep + 1}</h3>
                <button
                  className={`complete-button ${completedSteps.includes(currentStep) ? 'completed' : ''}`}
                  onClick={() => handleStepComplete(currentStep)}
                >
                  {completedSteps.includes(currentStep) ? 'Completed' : 'Mark Complete'}
                </button>
              </div>
              <p className="step-description">{repairData.steps[currentStep].description}</p>
              {repairData.steps[currentStep].image && (
                <img
                  src={repairData.steps[currentStep].image}
                  alt={`Step ${currentStep + 1}`}
                  className="step-image"
                />
              )}
            </motion.div>
          </AnimatePresence>

          <div className="step-navigation">
            <button
              onClick={handlePreviousStep}
              disabled={currentStep === 0}
              className="nav-button"
            >
              Previous
            </button>
            <button
              onClick={handleNextStep}
              disabled={currentStep === repairData.steps.length - 1}
              className="nav-button"
            >
              Next
            </button>
          </div>
        </div>

        <div className="tools-sidebar">
          <div className="tools-header">
            <h3>Tools & Materials</h3>
            <button
              className="toggle-button"
              onClick={() => setShowTools(!showTools)}
            >
              {showTools ? 'Hide' : 'Show'}
            </button>
          </div>
          
          <AnimatePresence>
            {showTools && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="tools-content"
              >
                <div className="tools-section">
                  <h4>Tools Required</h4>
                  <div className="tools-list">
                    {repairData.tools.map((tool, index) => (
                      <div key={index} className="tool-item">
                        <input
                          type="checkbox"
                          id={`tool-${index}`}
                          checked={completedSteps.includes(currentStep)}
                          onChange={() => {}}
                        />
                        <label htmlFor={`tool-${index}`}>{tool}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="materials-section">
                  <h4>Materials Required</h4>
                  <div className="materials-list">
                    {repairData.materials.map((material, index) => (
                      <div key={index} className="material-item">
                        <input
                          type="checkbox"
                          id={`material-${index}`}
                          checked={completedSteps.includes(currentStep)}
                          onChange={() => {}}
                        />
                        <label htmlFor={`material-${index}`}>{material}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="estimated-time">
                  <h4>Estimated Time</h4>
                  <p>{repairData.estimatedTime}</p>
                </div>

                <button 
                  className="find-stores-button"
                  onClick={() => window.open('https://www.google.com/maps/search/hardware+stores+near+me', '_blank')}
                >
                  Find Nearby Hardware Stores
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default RepairGuide; 