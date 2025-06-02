import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import InputForm from './components/forms/InputForm';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <div className="hero-section">
        <h1 className="app-title">
          <span className="title-quick">Quick</span>
          <span className="title-fix">Fix</span>
          <span className="title-ai">AI</span>
        </h1>
        <p className="hero-subtitle">Your AI-powered home maintenance companion</p>
        <button 
          className="start-button"
          onClick={() => navigate('/repair')}
        >
          Start Repair
        </button>
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

function RepairPage() {
  const handleSubmit = async (input) => {
    // TODO: Implement API call to process the input
    console.log('Received input:', input);
  };

  return (
    <div className="App">
      <InputForm onSubmit={handleSubmit} />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/repair" element={<RepairPage />} />
      </Routes>
    </Router>
  );
}

export default App;
