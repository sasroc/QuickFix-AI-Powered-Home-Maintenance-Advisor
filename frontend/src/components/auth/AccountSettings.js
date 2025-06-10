import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getFirestore, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import ManageSubscriptionButton from './ManageSubscriptionButton';

const db = getFirestore();

const sectionStyle = {
  background: '#fff',
  borderRadius: 16,
  boxShadow: '0 4px 16px rgba(59,130,246,0.07)',
  margin: '2.5rem 0',
  padding: '2.5rem 2.5rem 2rem 2.5rem',
  maxWidth: 700,
  width: '100%',
  border: '1px solid #e5e7eb',
  textAlign: 'left',
};

const labelStyle = {
  fontWeight: 700,
  color: '#3b82f6',
  fontSize: '1.35rem',
  marginBottom: 18,
  display: 'block',
  letterSpacing: 0.5,
  textAlign: 'left',
};

const inputStyle = {
  padding: '0.5rem 1rem',
  fontSize: '1.1rem',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  marginRight: 8,
  marginBottom: 8,
  background: '#f3f4f6',
};

const buttonStyle = {
  background: 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  padding: '0.7rem 2rem',
  fontSize: '1.08rem',
  fontWeight: 700,
  cursor: 'pointer',
  marginRight: 12,
  marginTop: 8,
  boxShadow: '0 2px 8px rgba(59,130,246,0.08)',
  transition: 'background 0.2s',
};

const containerStyle = {
  width: '100vw',
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  padding: '60px 0 0 5vw',
};

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
    <div style={containerStyle}>
      <h2 style={{ marginBottom: '2.5rem', fontSize: '2.7rem', letterSpacing: 1, color: '#1f2937', fontWeight: 800, textAlign: 'left' }}>Account Settings</h2>
      {loading ? (
        <div style={{ textAlign: 'left', margin: '2rem 0' }}>Loading...</div>
      ) : (
        <div style={{ width: '100%', maxWidth: 900 }}>
          {/* Profile Section */}
          <section style={sectionStyle}>
            <h3 style={labelStyle}>Profile</h3>
            <div style={{ marginBottom: 18, fontSize: '1.1rem' }}>
              <strong>Email:</strong> {currentUser?.email}
            </div>
            <div style={{ marginBottom: 18, fontSize: '1.1rem' }}>
              <strong>Display Name:</strong>{' '}
              {editingName ? (
                <>
                  <input
                    style={inputStyle}
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Enter new display name"
                  />
                  <button style={buttonStyle} onClick={handleNameChange}>Save</button>
                  <button style={{ ...buttonStyle, background: '#888', color: '#fff', backgroundImage: 'none' }} onClick={() => setEditingName(false)}>Cancel</button>
                  {nameError && <div style={{ color: 'red', marginTop: 8 }}>{nameError}</div>}
                </>
              ) : (
                <>
                  {currentUser?.displayName || currentUser?.email?.split('@')[0]}
                  <button style={{ ...buttonStyle, marginLeft: 16, padding: '0.4rem 1.2rem', fontSize: '0.95rem' }} onClick={() => { setEditingName(true); setNewName(currentUser?.displayName || currentUser?.email?.split('@')[0]); }}>Edit</button>
                </>
              )}
            </div>
          </section>

          {/* Subscription Section */}
          <section style={sectionStyle}>
            <h3 style={labelStyle}>Subscription</h3>
            <div style={{ marginBottom: 12, fontSize: '1.1rem' }}>
              <strong>Status:</strong> {userData?.subscriptionStatus ? userData.subscriptionStatus.charAt(0).toUpperCase() + userData.subscriptionStatus.slice(1) : 'Inactive'}
            </div>
            <div style={{ marginBottom: 12, fontSize: '1.1rem' }}>
              <strong>Plan:</strong> {userData?.plan ? userData.plan.charAt(0).toUpperCase() + userData.plan.slice(1) : 'None'}
            </div>
            <ManageSubscriptionButton />
          </section>

          {/* Password Reset Section */}
          <section style={sectionStyle}>
            <h3 style={labelStyle}>Password & Security</h3>
            <button style={buttonStyle} onClick={handleResetPassword}>Send Password Reset Email</button>
            {resetMsg && <div style={{ color: resetMsg.includes('sent') ? 'green' : 'red', marginTop: 8 }}>{resetMsg}</div>}
          </section>

          {/* Delete Account Section */}
          <section style={{ ...sectionStyle, border: '1.5px solid #f87171', background: '#fff0f1' }}>
            <h3 style={{ ...labelStyle, color: '#c00' }}>Danger Zone</h3>
            {!deleteConfirm ? (
              <button style={{ ...buttonStyle, background: '#c00', backgroundImage: 'none' }} onClick={() => setDeleteConfirm(true)}>Delete Account</button>
            ) : (
              <>
                <div style={{ marginBottom: 12, color: '#c00', fontWeight: 600 }}>Are you sure? This cannot be undone.</div>
                <button style={{ ...buttonStyle, background: '#c00', backgroundImage: 'none' }} onClick={handleDeleteAccount}>Yes, Delete</button>
                <button style={{ ...buttonStyle, background: '#888', color: '#fff', backgroundImage: 'none' }} onClick={() => setDeleteConfirm(false)}>Cancel</button>
                {deleteError && <div style={{ color: 'red', marginTop: 8 }}>{deleteError}</div>}
                {deleteSuccess && <div style={{ color: 'green', marginTop: 8 }}>{deleteSuccess}</div>}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default AccountSettings; 