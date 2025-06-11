import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getFirestore, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import ManageSubscriptionButton from './ManageSubscriptionButton';
import './AccountSettings.css';

const db = getFirestore();

const AccountSettings = () => {
  const { currentUser, updateDisplayName, resetPassword, deleteAccount } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [nameError, setNameError] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');

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
    <div className="settings-container">
      <h2 className="settings-title">Account Settings</h2>
      {loading ? (
        <div className="section-content">Loading...</div>
      ) : (
        <div className="settings-content">
          {/* Profile Section */}
          <section className="settings-section">
            <h3 className="section-title">Profile</h3>
            <div className="section-content">
              <strong>Email:</strong> {currentUser?.email}
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
            <button className="action-button" onClick={handleResetPassword}>Send Password Reset Email</button>
            {resetMsg && <div className={resetMsg.includes('sent') ? 'success-message' : 'error-message'}>{resetMsg}</div>}
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