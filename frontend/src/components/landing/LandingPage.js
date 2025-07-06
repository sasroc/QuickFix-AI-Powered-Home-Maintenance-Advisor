import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import './LandingPage.css';

const db = getFirestore();

function LandingPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);

  // Fetch user data to check trial eligibility
  useEffect(() => {
    if (!currentUser) {
      setUserData(null);
      return;
    }
    
    const userRef = doc(db, 'users', currentUser.uid);
    const unsub = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        setUserData(snap.data());
      }
    });
    return unsub;
  }, [currentUser]);

  const handleStartRepair = () => {
    if (currentUser) {
      navigate('/repair');
    } else {
      navigate('/auth', { state: { from: { pathname: '/repair' } } });
    }
  };

  const handleStartTrial = () => {
    if (currentUser) {
      navigate('/pricing', { state: { startTrial: true } });
    } else {
      navigate('/auth', { state: { from: { pathname: '/pricing' }, startTrial: true } });
    }
  };

  // Determine if user can start a trial
  const canStartTrial = !currentUser || (userData && !userData.wasOnTrial && userData.subscriptionStatus !== 'active');

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-visible');
        }
      });
    }, observerOptions);

    // Observe all elements with animate-on-scroll class
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach((el) => observer.observe(el));

    return () => {
      animatedElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="landing-page-container">
      <div className="limited-time-offer-banner">
        <p>
          <strong>🎉 Limited Time Offer!</strong> Get <strong>30% OFF</strong> all subscription plans. This offer expires on August 6th.
          <a href="/pricing" className="offer-link">Claim Offer Now</a>
        </p>
      </div>

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
            {canStartTrial ? (
              <button onClick={handleStartTrial} className="trial-button">
                🚀 Start Your 5-Day FREE Trial
              </button>
            ) : userData && userData.subscriptionStatus === 'active' ? (
              <button onClick={handleStartRepair} className="trial-button">
                ✅ Continue with Your Subscription
              </button>
            ) : userData && userData.wasOnTrial ? (
              <Link to="/pricing" className="trial-button">
                📋 View Subscription Plans
              </Link>
            ) : (
              <button onClick={handleStartTrial} className="trial-button">
                🚀 Start Your 5-Day FREE Trial
              </button>
            )}
            <div className="secondary-cta-buttons">
              <button onClick={handleStartRepair} className="secondary-button">
              Start Your Repair Now
            </button>
            <Link to="/community" className="secondary-button">
              View Success Stories
            </Link>
            </div>
          </div>
        </div>

        {/* Steps Section - Keeping original position */}
        <div className="steps-section">
          <div className="step-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="step-number">1</div>
            <h3>Describe Your Issue</h3>
            <p>Simply tell us about your repair problem using text, voice, or upload a photo. Our AI understands natural language and visual cues.</p>
            <div className="step-emoji" style={{ marginTop: 'auto', paddingBottom: '2rem' }}>📝</div>
          </div>
          <div className="step-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="step-number">2</div>
            <h3>Get AI Guidance</h3>
            <p>Receive personalized step-by-step instructions tailored to your specific situation, including safety warnings and professional tips.</p>
            <div className="step-emoji" style={{ marginTop: 'auto', paddingBottom: '2rem' }}>🤖</div>
          </div>
          <div className="step-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="step-number">3</div>
            <h3>Fix with Confidence</h3>
            <p>Follow our interactive guide with exact tool recommendations, time estimates, and when to call a professional.</p>
            <div className="step-emoji" style={{ marginTop: 'auto', paddingBottom: '2rem' }}>🔧</div>
          </div>
        </div>

        {/* Features Section */}
        <div className="features-section">
          <h2 className="section-title">Why Choose QuickFix AI for Home Repairs?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <span className="feature-icon">📝</span>
              <h3>Smart AI Diagnosis</h3>
              <p>Advanced AI technology analyzes your repair issue and provides accurate, personalized solutions for your specific situation.</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🔧</span>
              <h3>Professional-Grade Guides</h3>
              <p>Step-by-step instructions written by repair experts, with safety precautions and professional techniques.</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🎯</span>
              <h3>Comprehensive Coverage</h3>
              <p>From simple plumbing fixes to complex electrical work, HVAC maintenance, and structural repairs - we've got you covered.</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">📱</span>
              <h3>Always Accessible</h3>
              <p>Access repair guidance on any device, anywhere, anytime. Perfect for emergency repairs and planned maintenance.</p>
            </div>
          </div>
        </div>

        {/* Founder Story Section */}
        <div className="team-story-section">
          <h2 className="section-title">Meet the Developer</h2>
          <div className="story-content">
            <div className="story-image">
              <img src="/images/developing.jpeg" alt="Rocco Sassani working on QuickFix AI development" />
            </div>
            <div className="story-text">
              <h3>A Developer's Journey to Simplify Home Repairs</h3>
              <p>Hi, I'm Rocco Sassani, a software developer with a passion for solving real-world problems. QuickFixAI was born from my own frustrating experiences with home repairs – particularly a memorable experience battling with what should have been a simple water filter repair.</p>
              <p>That experience made me realize that while there's plenty of home repair information available online, finding the right guidance at the right moment is surprisingly difficult. As a developer, I knew there had to be a better way. By combining my software engineering expertise with AI technology, I've created QuickFixAI to make home repairs more approachable for everyone.</p>
              <div className="founder-principles">
                <div className="principle-item">
                  <span className="principle-icon">💡</span>
                  <h4>Problem-Solver First</h4>
                  <p>Every feature is built to solve real repair challenges</p>
                </div>
                <div className="principle-item">
                  <span className="principle-icon">🔍</span>
                  <h4>Accuracy Focused</h4>
                  <p>Continuously refined AI guidance based on expert input</p>
                </div>
                <div className="principle-item">
                  <span className="principle-icon">👋</span>
                  <h4>Direct Support</h4>
                  <p>Personal attention to user feedback and needs</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Demo Section */}
        <div className="demo-section">
          <h2 className="section-title">See QuickFixAI in Action</h2>
          <div className="demo-container">
            <div className="video-wrapper">
              {/* Replace VIDEO_ID with your actual YouTube video ID */}
              <iframe 
                src="https://www.youtube.com/embed/psJXd5XGru4"
                title="QuickFixAI Demo - AI-Powered Home Repair Guidance"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="demo-features">
              <div className="demo-feature">
                <span className="demo-icon">🤖</span>
                <h4>Real-Time AI Analysis</h4>
                <p>Watch as our AI instantly understands and diagnoses repair issues</p>
              </div>
              <div className="demo-feature">
                <span className="demo-icon">📝</span>
                <h4>Step-by-Step Guidance</h4>
                <p>Clear, detailed instructions tailored to your specific situation</p>
              </div>
              <div className="demo-feature">
                <span className="demo-icon">⚡</span>
                <h4>Instant Solutions</h4>
                <p>Get immediate, actionable repair guidance when you need it</p>
              </div>
            </div>
          </div>
        </div>

        {/* Before/After Section */}
        <div className="before-after-section">
          <h2 className="section-title">See Real Repair Transformations</h2>
          <div className="before-after-grid">
            <div className="before-after-card">
              <div className="image-comparison">
                <div className="before">
                  <img src="/images/faucetb4.png" alt="Leaky kitchen faucet before repair showing water dripping" />
                  <span className="label">Before</span>
                </div>
                <div className="after">
                  <img src="/images/faucetafter.png" alt="Fixed kitchen faucet after repair, no leaks" />
                  <span className="label">After</span>
                </div>
              </div>
              <h3>Leaky Faucet Repair</h3>
              <p>Fixed a dripping kitchen faucet with proper washer replacement and seal installation</p>
            </div>
            <div className="before-after-card">
              <div className="image-comparison">
                <div className="before">
                  <img src="/images/wallb4.png" alt="Damaged drywall with hole showing wall studs" />
                  <span className="label">Before</span>
                </div>
                <div className="after">
                  <img src="/images/wallafter.png" alt="Smooth repaired drywall with seamless finish" />
                  <span className="label">After</span>
                </div>
              </div>
              <h3>Drywall Repair</h3>
              <p>Patched and finished a hole in the wall with professional-grade results and seamless texture matching</p>
            </div>
            <div className="before-after-card">
              <div className="image-comparison">
                <div className="before">
                  <img src="/images/outletb4.png" alt="Faulty electrical outlet with damaged cover" />
                  <span className="label">Before</span>
                </div>
                <div className="after">
                  <img src="/images/outletafter.png" alt="Safely installed electrical outlet with new cover" />
                  <span className="label">After</span>
                </div>
              </div>
              <h3>Electrical Outlet Fix</h3>
              <p>Replaced a faulty outlet with proper safety measures and code-compliant installation</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="cta-section">
          <h2>Ready to Master Your Home Repairs?</h2>
          <p>Join homeowners who are taking control of their maintenance with AI-powered guidance. Save money, learn new skills, and keep your home in perfect condition.</p>
          <button onClick={handleStartRepair} className="start-button">
            Start Your First Repair
          </button>
        </div>

        {/* FAQ Section */}
        <div className="faq-section">
          <h2 className="section-title">Frequently Asked Questions</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h3>What is QuickFix AI and how does it work?</h3>
              <p>QuickFix AI is an intelligent home maintenance platform that uses advanced artificial intelligence to provide personalized repair guidance. Simply describe your issue or upload a photo, and our AI will generate step-by-step instructions tailored to your specific situation, including tool recommendations and safety precautions.</p>
            </div>
            <div className="faq-item">
              <h3>What types of home repairs can QuickFix AI help with?</h3>
              <p>QuickFix AI covers a comprehensive range of home repairs including plumbing (leaks, clogs, fixture replacement), electrical (outlet repair, switch installation, lighting), HVAC maintenance, drywall repair, painting, basic carpentry, appliance troubleshooting, and many more common household issues.</p>
            </div>
            <div className="faq-item">
              <h3>Is it safe to follow AI-generated repair guides?</h3>
              <p>Our AI provides detailed, accurate repair guides with built-in safety warnings. However, we always recommend consulting with a licensed professional for complex electrical work, major plumbing projects, or any repairs involving gas lines. Our guides clearly indicate when professional help is required.</p>
            </div>
            <div className="faq-item">
              <h3>Do I need any special tools or experience?</h3>
              <p>Most repairs can be completed with basic household tools. Our guides specify exactly what tools you'll need and provide alternatives when possible. No prior repair experience is required - our step-by-step instructions are designed for beginners while being detailed enough for DIY enthusiasts.</p>
            </div>
            <div className="faq-item">
              <h3>How accurate are the repair instructions?</h3>
              <p>Our AI has been trained on thousands of repair scenarios and professional techniques. The instructions are based on industry best practices and include safety measures. We continuously improve our AI based on user feedback and professional input to ensure accuracy and reliability.</p>
            </div>
            <div className="faq-item">
              <h3>Can I use QuickFix AI on my mobile device?</h3>
              <p>Absolutely! QuickFix AI is fully optimized for mobile devices. You can access repair guides on your smartphone or tablet, making it perfect for on-the-spot repairs. The interface adapts to your screen size and includes touch-friendly controls.</p>
            </div>
          </div>
          <div className="faq-cta">
            <Link to="/faq" className="secondary-button">
              View All FAQs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage; 