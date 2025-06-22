import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getFirestore, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { verifyBeforeUpdateEmail } from 'firebase/auth';
import ManageSubscriptionButton from './ManageSubscriptionButton';
import './AccountSettings.css';

const db = getFirestore();

const AccountSettings = () => {
  const { currentUser, updateDisplayName, resetPassword, deleteAccount } = useAuth();
  const { isDarkMode } = useTheme();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [nameError, setNameError] = useState('');
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');

  // Check if user signed up with Google OAuth
  const isGoogleUser = currentUser?.providerData?.some(provider => provider.providerId === 'google.com');

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;
      const userRef = doc(db, 'users', currentUser.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        setUserData(snap.data());
      }
      setLoading(false);
    };
    fetchUserData();
  }, [currentUser]);

  const handleNameChange = async () => {
    setNameError('');
    if (!newName.trim()) {
      setNameError('Display name cannot be empty.');
      return;
    }
    try {
      await updateDisplayName(newName.trim());
      await updateDoc(doc(db, 'users', currentUser.uid), { displayName: newName.trim() });
      setEditingName(false);
    } catch (err) {
      setNameError('Failed to update display name.');
    }
  };

  const handleEmailChange = async () => {
    setEmailError('');
    setEmailSuccess('');
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    if (newEmail === currentUser.email) {
      setEmailError('This is already your current email address.');
      return;
    }

    try {
      console.log('Attempting to send verification email to:', newEmail);
      // Send verification email to new email address
      // Firebase will automatically update the email once verified
      await verifyBeforeUpdateEmail(currentUser, newEmail);
      
      console.log('Verification email sent successfully');
      setEmailSuccess(`Verification email sent to ${newEmail}! Please check your new email and click the verification link. Don't see the email? Check your spam folder. After clicking the link, you'll be logged out - sign back in using your NEW email address (${newEmail}) with your current password.`);
      setEditingEmail(false);
    } catch (err) {
      console.error('Email update error:', err);
      
      // Handle specific Firebase errors
      if (err.code === 'auth/invalid-email') {
        setEmailError('Invalid email address format.');
      } else if (err.code === 'auth/email-already-in-use') {
        setEmailError('This email is already in use by another account.');
      } else if (err.code === 'auth/requires-recent-login') {
        setEmailError('For security reasons, please log out and log back in before changing your email, then try again.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setEmailError('Email changes are not allowed. Please contact support.');
      } else if (err.code === 'auth/too-many-requests') {
        setEmailError('Too many requests. Please wait before trying again.');
      } else {
        setEmailError('Failed to send verification email. Please try again.');
      }
    }
  };

  const handleResetPassword = async () => {
    setResetMsg('');
    try {
      await resetPassword(currentUser.email);
      setResetMsg('Password reset email sent!');
    } catch (err) {
      setResetMsg('Failed to send password reset email.');
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    setDeleteSuccess('');
    try {
      await deleteAccount();
      await deleteDoc(doc(db, 'users', currentUser.uid));
      setDeleteSuccess('Account deleted.');
    } catch (err) {
      setDeleteError('Failed to delete account.');
    }
  };

  return (
    <div className={`settings-container ${isDarkMode ? 'dark' : ''}`}>
      <h2 className="settings-title">Account Settings</h2>
      {loading ? (
        <div className="section-content">Loading...</div>
      ) : (
        <div className="settings-content">
          {/* Profile Section */}
          <section className="settings-section">
            <h3 className="section-title">Profile</h3>
            <div className="section-content">
              <strong>Email:</strong>{' '}
              {isGoogleUser ? (
                <>
                  {currentUser?.email}
                  <span className="auth-provider-note"> (Google Account)</span>
                  <div className="info-message" style={{ marginTop: '8px', fontSize: '0.9em', color: '#666' }}>
                    To change your email, please update it in your Google account settings. Your QuickFix email will automatically sync with your Google account.
                  </div>
                </>
              ) : editingEmail ? (
                <>
                  <input
                    className="input-field"
                    type="email"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="Enter new email address"
                  />
                  <button className="action-button" onClick={handleEmailChange}>Save</button>
                  <button className="action-button secondary" onClick={() => { setEditingEmail(false); setEmailError(''); setEmailSuccess(''); }}>Cancel</button>
                </>
              ) : (
                <>
                  {currentUser?.email}
                  <button className="action-button" onClick={() => { setEditingEmail(true); setNewEmail(currentUser?.email || ''); setEmailError(''); setEmailSuccess(''); }}>Change Email</button>
                </>
              )}
              {/* Show messages outside the editing interface so they persist */}
              {!isGoogleUser && (emailError || emailSuccess) && (
                <div style={{ marginTop: '12px' }}>
                  {emailError && <div className="error-message">{emailError}</div>}
                  {emailSuccess && <div className="success-message">{emailSuccess}</div>}
                </div>
              )}
            </div>
            <div className="section-content">
              <strong>Display Name:</strong>{' '}
              {editingName ? (
                <>
                  <input
                    className="input-field"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Enter new display name"
                  />
                  <button className="action-button" onClick={handleNameChange}>Save</button>
                  <button className="action-button secondary" onClick={() => setEditingName(false)}>Cancel</button>
                  {nameError && <div className="error-message">{nameError}</div>}
                </>
              ) : (
                <>
                  {currentUser?.displayName || currentUser?.email?.split('@')[0]}
                  <button className="action-button" onClick={() => { setEditingName(true); setNewName(currentUser?.displayName || currentUser?.email?.split('@')[0]); }}>Edit</button>
                </>
              )}
            </div>
          </section>

          {/* Subscription Section */}
          <section className="settings-section">
            <h3 className="section-title">Subscription</h3>
            <div className="section-content">
              <strong>Status:</strong> {userData?.subscriptionStatus ? userData.subscriptionStatus.charAt(0).toUpperCase() + userData.subscriptionStatus.slice(1) : 'Inactive'}
            </div>
            <div className="section-content">
              <strong>Plan:</strong> {userData?.plan ? userData.plan.charAt(0).toUpperCase() + userData.plan.slice(1) : 'None'}
            </div>
            <ManageSubscriptionButton />
          </section>

          {/* Password Reset Section */}
          <section className="settings-section">
            <h3 className="section-title">Password & Security</h3>
            {isGoogleUser ? (
              <div className="info-message">
                You signed in with Google. To change your password, please update it in your Google account settings.
              </div>
            ) : (
              <>
                <button className="action-button" onClick={handleResetPassword}>Send Password Reset Email</button>
                {resetMsg && <div className={resetMsg.includes('sent') ? 'success-message' : 'error-message'}>{resetMsg}</div>}
              </>
            )}
          </section>

          {/* Delete Account Section */}
          <section className="settings-section danger-zone">
            <h3 className="section-title">Danger Zone</h3>
            {!deleteConfirm ? (
              <button className="action-button danger" onClick={() => setDeleteConfirm(true)}>Delete Account</button>
            ) : (
              <>
                <div className="section-content" style={{ color: '#c00', fontWeight: 600 }}>Are you sure? This cannot be undone.</div>
                <button className="action-button danger" onClick={handleDeleteAccount}>Yes, Delete</button>
                <button className="action-button secondary" onClick={() => setDeleteConfirm(false)}>Cancel</button>
                {deleteError && <div className="error-message">{deleteError}</div>}
                {deleteSuccess && <div className="success-message">{deleteSuccess}</div>}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default AccountSettings; 