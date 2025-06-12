import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './LandingPage.css';

function LandingPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleStartRepair = () => {
    if (currentUser) {
      navigate('/repair');
    } else {
      navigate('/auth', { state: { from: { pathname: '/repair' } } });
    }
  };

  return (
    <div className="landing-page" style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="quickfix-gradient-bg" />
      <div className="hero-section" style={{ position: 'relative', zIndex: 1 }}>
        <h1 className="app-title">
          <span className="title-quick">Quick</span>
          <span className="title-fix">Fix</span>
          <span className="title-ai">AI</span>
        </h1>
        <p className="hero-subtitle">Your AI-powered home maintenance companion</p>
        <div className="cta-buttons">
          <button onClick={handleStartRepair} className="start-button">
            Start Repair
          </button>
          <Link to="/community" className="secondary-button">
            View Success Stories
          </Link>
        </div>
      </div>

      <div className="steps-section">
        <div className="step-card">
          <div className="step-number">1</div>
          <h3>Describe Your Issue</h3>
          <p>Tell us about your repair problem using text, voice, or upload an image</p>
        </div>
        <div className="step-card">
          <div className="step-number">2</div>
          <h3>Get AI Guidance</h3>
          <p>Receive personalized step-by-step instructions tailored to your specific situation</p>
        </div>
        <div className="step-card">
          <div className="step-number">3</div>
          <h3>Fix with Confidence</h3>
          <p>Follow our interactive guide with tool recommendations and time estimates</p>
        </div>
      </div>
    </div>
  );
}

export default LandingPage; 