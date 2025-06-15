import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';
import { useAuth } from '../../contexts/AuthContext';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [showConfetti, setShowConfetti] = useState(true);

  // Prevent vertical scrolling on this page
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Handle window resize for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Stop confetti after a few seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 7000);
    return () => clearTimeout(timer);
  }, []);

  // Get display name or fallback
  const getDisplayName = () => {
    if (!currentUser) return '';
    return currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : '');
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 0,
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box',
    }}>
      {/* Confetti animation */}
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={220}
          recycle={false}
        />
      )}
      {/* Animated background elements */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 50%)',
        animation: 'rotate 20s linear infinite',
        zIndex: 0
      }} />

      {/* Content container */}
      <div className="payment-success-glass-container" style={{
        position: 'relative',
        zIndex: 1,
        background: 'rgba(255, 255, 255, 0.15)',
        borderRadius: '24px',
        padding: '3rem',
        maxWidth: '600px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1.5px solid rgba(255, 255, 255, 0.3)',
        animation: 'slideUp 0.5s ease-out',
        marginTop: 0,
      }}>
        <div style={{
          fontSize: '3rem',
          marginBottom: '1.5rem',
          animation: 'bounce 1s ease-out',
          filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
        }}>
          🎉
        </div>
        
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 800,
          marginBottom: '1rem',
          color: 'white',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          Thank You for Subscribing{getDisplayName() ? `, ${getDisplayName()}!` : '!' }
        </h1>
        
        <p style={{
          fontSize: '1.25rem',
          color: 'rgba(255, 255, 255, 0.9)',
          marginBottom: '2.5rem',
          lineHeight: 1.6,
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
        }}>
          Welcome to QuickFix! Your subscription is now active. We're excited to help you with all your home maintenance needs.
        </p>

        <button
          onClick={() => navigate('/repair')}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            padding: '1rem 2.5rem',
            fontSize: '1.2rem',
            fontWeight: 600,
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            position: 'relative',
            overflow: 'hidden',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.background = 'rgba(255, 255, 255, 0.3)';
            e.target.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.2)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
          }}
        >
          Start Using QuickFix
        </button>
      </div>

      <style>
        {`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
              transform: translateY(0);
            }
            40% {
              transform: translateY(-20px);
            }
            60% {
              transform: translateY(-10px);
            }
          }

          @keyframes rotate {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          @media (max-width: 600px) {
            .payment-success-glass-container {
              max-width: 95vw !important;
              padding: 1.2rem !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default PaymentSuccess; 