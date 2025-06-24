import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import DisplayNameModal from '../auth/DisplayNameModal';
import FeedbackButton from '../feedback/FeedbackButton';
import logo from '../../assets/logo2.png';
import './Navbar.css';

function Navbar() {
  const { currentUser, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDisplayNameModalOpen, setIsDisplayNameModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      // Close dropdown if clicking outside
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      
      // Close mobile menu if clicking outside
      if (isMenuOpen && menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }

    if (isDropdownOpen || isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, isMenuOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      setIsMenuOpen(false); // Close mobile menu after logout
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeMobileMenu = () => {
    setIsMenuOpen(false);
  };

  const getDisplayName = () => {
    if (!currentUser) return '';
    return currentUser.displayName || currentUser.email.split('@')[0];
  };

  const getInitials = () => {
    const name = getDisplayName();
    return name.charAt(0).toUpperCase();
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <img src={logo} alt="QuickFixAI Logo" />
          <span>QuickFixAI</span>
        </Link>

        <button className="mobile-menu-button" onClick={toggleMenu}>
          <span className={`hamburger ${isMenuOpen ? 'open' : ''}`}></span>
        </button>

        <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`} ref={menuRef}>
          <div className="navbar-start">
            <Link to="/pricing" className="navbar-item" onClick={closeMobileMenu}>
              Pricing
            </Link>
            <Link to="/faq" className="navbar-item" onClick={closeMobileMenu}>
              FAQ
            </Link>
          </div>

          <div className="navbar-end">
            {/* Theme Toggle Button */}
            <button 
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? (
                <svg className="theme-icon" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"/>
                </svg>
              ) : (
                <svg className="theme-icon" viewBox="0 0 24 24" fill="black">
                  <path d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z"/>
                </svg>
              )}
            </button>

            {/* Feedback Button */}
            <FeedbackButton />

            {currentUser ? (
              <div className="user-menu" ref={dropdownRef}>
                <button 
                  className="user-button"
                  onClick={toggleDropdown}
                >
                  <div className="user-avatar">
                    {getInitials()}
                  </div>
                  <span className="user-email">{getDisplayName()}</span>
                  <span className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}>▼</span>
                </button>
                
                {isDropdownOpen && (
                  <div className="dropdown-menu">
                    <button 
                      className="dropdown-item"
                      onClick={() => {
                        setIsDisplayNameModalOpen(true);
                        setIsDropdownOpen(false);
                        closeMobileMenu();
                      }}
                    >
                      Change Display Name
                    </button>
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        navigate('/settings');
                        setIsDropdownOpen(false);
                        closeMobileMenu();
                      }}
                    >
                      Settings
                    </button>
                    <button 
                      className="dropdown-item"
                      onClick={handleLogout}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/auth" className="login-button" onClick={closeMobileMenu}>
                Log In
              </Link>
            )}
          </div>
        </div>
      </div>

      <DisplayNameModal 
        isOpen={isDisplayNameModalOpen}
        onClose={() => setIsDisplayNameModalOpen(false)}
      />
    </nav>
  );
}

export default Navbar; 