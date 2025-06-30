import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './AuthPage.css';

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(null);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { currentUser, login, signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (currentUser) {
      // Preserve the startTrial state when redirecting after auth
      const redirectState = location.state?.startTrial ? { startTrial: true } : {};
      navigate(from, { replace: true, state: redirectState });
    }
  }, [currentUser, navigate, from, location.state]);

  useEffect(() => {
    if (!isLogin && password && confirmPassword) {
      setPasswordMatch(password === confirmPassword);
    } else {
      setPasswordMatch(null);
    }
  }, [password, confirmPassword, isLogin]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!isLogin && !agreeToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password);
      }
      // Preserve the startTrial state when redirecting after auth
      const redirectState = location.state?.startTrial ? { startTrial: true } : {};
      navigate(from, { replace: true, state: redirectState });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      // Preserve the startTrial state when redirecting after auth
      const redirectState = location.state?.startTrial ? { startTrial: true } : {};
      navigate(from, { replace: true, state: redirectState });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  // Don't render anything if user is already authenticated
  if (currentUser) {
    return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Redirecting...</div>;
  }

  return (
    <div className="auth-container" style={{ 
      position: 'relative', 
      overflow: 'hidden',
      width: '100vw',
      maxWidth: '100vw',
      boxSizing: 'border-box'
    }}>
      <div className="quickfix-gradient-bg" />
      <div className="auth-card" style={{ 
        position: 'relative', 
        zIndex: 1,
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div className="auth-header">
          <h1 className="app-title">
            <span className="title-quick">Quick</span>
            <span className="title-fix">Fix</span>
            <span className="title-ai">AI</span>
          </h1>
          <h2>{isLogin ? 'Welcome Back!' : 'Create Account'}</h2>
          <p>{isLogin ? 'Sign in to continue' : 'Join QuickFix to get started'}</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-confirm-container">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm your password"
                  className={passwordMatch !== null ? (passwordMatch ? 'valid' : 'invalid') : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex="-1"
                >
                  {showConfirmPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  )}
                </button>
                {passwordMatch !== null && (
                  <span className={`password-icon ${passwordMatch ? 'valid' : 'invalid'}`}>
                    {passwordMatch ? '✓' : '✕'}
                  </span>
                )}
              </div>
            </div>
          )}

          {!isLogin && (
            <div className="terms-checkbox-group">
              <label className="terms-checkbox-label">
                <input
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="terms-checkbox"
                />
                <span className="terms-text">
                  I agree to the{' '}
                  <Link to="/terms" className="terms-link" target="_blank" rel="noopener noreferrer">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="terms-link" target="_blank" rel="noopener noreferrer">
                    Privacy Policy
                  </Link>
                </span>
              </label>
            </div>
          )}

          <button
            type="submit"
            className="auth-button"
            disabled={loading || (!isLogin && (!passwordMatch || !agreeToTerms))}
          >
            {loading ? (
              <span className="loading-spinner"></span>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div className="divider">
          <span>or</span>
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="google-button"
          disabled={loading}
        >
          <img
            src="https://www.google.com/favicon.ico"
            alt="Google"
            className="google-icon"
          />
          Continue with Google
        </button>

        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              className="toggle-auth-mode"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setPasswordMatch(null);
                setAgreeToTerms(false);
                setShowPassword(false);
                setShowConfirmPassword(false);
              }}
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthPage; 