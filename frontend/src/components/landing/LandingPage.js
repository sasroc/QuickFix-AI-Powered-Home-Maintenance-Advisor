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
      
      {/* Trust Badges - Moved to top right */}
      <div className="trust-badges">
        <div className="badge">
          <span className="badge-icon">🔒</span>
          <span className="badge-text">Secure & Private</span>
        </div>
        <div className="badge">
          <span className="badge-icon">⚡</span>
          <span className="badge-text">Instant Solutions</span>
        </div>
        <div className="badge">
          <span className="badge-icon">🎯</span>
          <span className="badge-text">Accurate Results</span>
        </div>
      </div>

      {/* Hero Section */}
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

      {/* Steps Section - Keeping original position */}
      <div className="steps-section">
        <div className="step-card" style={{ height: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="step-number">1</div>
          <h3>Describe Your Issue</h3>
          <p>Tell us about your repair problem using text, voice, or upload an image</p>
          <div className="step-emoji" style={{ marginTop: 'auto', paddingBottom: '2rem' }}>📝</div>
        </div>
        <div className="step-card" style={{ height: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="step-number">2</div>
          <h3>Get AI Guidance</h3>
          <p>Receive personalized step-by-step instructions tailored to your specific situation</p>
          <div className="step-emoji" style={{ marginTop: 'auto', paddingBottom: '2rem' }}>🤖</div>
        </div>
        <div className="step-card" style={{ height: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="step-number">3</div>
          <h3>Fix with Confidence</h3>
          <p>Follow our interactive guide with tool recommendations and time estimates</p>
          <div className="step-emoji" style={{ marginTop: 'auto', paddingBottom: '2rem' }}>🔧</div>
        </div>
      </div>

      {/* Features Section */}
      <div className="features-section">
        <h2 className="section-title">Why Choose QuickFix AI?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">📝</span>
            <h3>Smart Diagnosis</h3>
            <p>Get instant AI-powered analysis of your home maintenance issues</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🔧</span>
            <h3>Step-by-Step Guides</h3>
            <p>Follow detailed instructions tailored to your specific situation</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🎯</span>
            <h3>Expert Solutions</h3>
            <p>Access professional-grade repair guidance for any home issue</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">📱</span>
            <h3>Mobile Friendly</h3>
            <p>Access solutions on any device, anywhere, anytime</p>
          </div>
        </div>
      </div>

      {/* Before/After Section */}
      <div className="before-after-section">
        <h2 className="section-title">See the Results</h2>
        <div className="before-after-grid">
          <div className="before-after-card">
            <div className="image-comparison">
              <div className="before">
                <img src="/images/faucetb4.png" alt="Leaky faucet before repair" />
                <span className="label">Before</span>
              </div>
              <div className="after">
                <img src="/images/faucetafter.png" alt="Leaky faucet after repair" />
                <span className="label">After</span>
              </div>
            </div>
            <h3>Leaky Faucet Repair</h3>
            <p>Fixed a dripping kitchen faucet with proper washer replacement</p>
          </div>
          <div className="before-after-card">
            <div className="image-comparison">
              <div className="before">
                <img src="/images/wallb4.png" alt="Damaged drywall before repair" />
                <span className="label">Before</span>
              </div>
              <div className="after">
                <img src="/images/wallafter.png" alt="Drywall after repair" />
                <span className="label">After</span>
              </div>
            </div>
            <h3>Drywall Repair</h3>
            <p>Patched and finished a hole in the wall with professional results</p>
          </div>
          <div className="before-after-card">
            <div className="image-comparison">
              <div className="before">
                <img src="https://placehold.co/400x300/e2e8f0/64748b?text=Before" alt="Faulty outlet before repair" />
                <span className="label">Before</span>
              </div>
              <div className="after">
                <img src="https://placehold.co/400x300/e2e8f0/64748b?text=After" alt="Fixed outlet after repair" />
                <span className="label">After</span>
              </div>
            </div>
            <h3>Electrical Outlet Fix</h3>
            <p>Replaced a faulty outlet with proper safety measures</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="cta-section">
        <h2>Ready to Fix Your Home Issues?</h2>
        <p>Join thousands of homeowners who trust QuickFix AI for their maintenance needs</p>
        <button onClick={handleStartRepair} className="start-button">
          Start Your Repair Now
        </button>
      </div>

      {/* FAQ Section */}
      <div className="faq-section">
        <h2 className="section-title">Frequently Asked Questions</h2>
        <div className="faq-grid">
          <div className="faq-item">
            <h3>What is QuickFixAI?</h3>
            <p>QuickFixAI is an AI-powered home maintenance advisor that provides detailed repair guides and solutions for common household issues. Our platform uses advanced AI technology to help homeowners diagnose and fix problems around their homes.</p>
          </div>
          <div className="faq-item">
            <h3>What kind of repairs can QuickFixAI help with?</h3>
            <p>QuickFixAI can help with a wide range of home repairs, from basic plumbing and electrical issues to more complex HVAC and structural problems. Our AI provides step-by-step guides, safety precautions, and troubleshooting tips for each repair.</p>
          </div>
          <div className="faq-item">
            <h3>Is it safe to follow AI-generated repair guides?</h3>
            <p>While our AI provides detailed and accurate repair guides, we always recommend consulting with a professional for complex or potentially dangerous repairs. Our guides include safety warnings and when to call a professional.</p>
          </div>
        </div>
        <div className="faq-cta">
          <Link to="/faq" className="secondary-button">
            View All FAQs
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LandingPage; 