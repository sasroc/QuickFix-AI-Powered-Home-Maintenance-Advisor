import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DisplayNameModal from '../auth/DisplayNameModal';
import logo from '../../assets/logo2.png';
import './Navbar.css';

function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDisplayNameModalOpen, setIsDisplayNameModalOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
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

        <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
          <div className="navbar-start">
            <Link to="/pricing" className="navbar-item">
              Pricing
            </Link>
            <Link to="/faq" className="navbar-item">
              FAQ
            </Link>
          </div>

          <div className="navbar-end">
            {currentUser ? (
              <div className="user-menu">
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
                      }}
                    >
                      Change Display Name
                    </button>
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        navigate('/settings');
                        setIsDropdownOpen(false);
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
              <Link to="/auth" className="login-button">
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