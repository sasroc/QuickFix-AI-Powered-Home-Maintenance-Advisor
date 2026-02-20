import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { getFirestore, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth } from '../config/firebase';
import useAnalytics from '../hooks/useAnalytics';
import { setUserContext, captureException } from '../utils/sentry';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

const db = getFirestore();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { trackEvent } = useAnalytics();

  async function signup(email, password) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      trackEvent('user_signup', {
        method: 'email',
        user_id: result.user.uid
      });
      return result;
    } catch (error) {
      trackEvent('signup_error', {
        error_code: error.code,
        error_message: error.message
      });
      captureException(error, {
        context: 'signup',
        method: 'email',
        errorCode: error.code
      });
      throw error;
    }
  }

  async function login(email, password) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      trackEvent('user_login', {
        method: 'email',
        user_id: result.user.uid
      });
      return result;
    } catch (error) {
      trackEvent('login_error', {
        error_code: error.code,
        error_message: error.message
      });
      captureException(error, {
        context: 'login',
        method: 'email',
        errorCode: error.code
      });
      throw error;
    }
  }

  async function loginWithGoogle() {
    try {
    const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      trackEvent('user_login', {
        method: 'google',
        user_id: result.user.uid
      });
      return result;
    } catch (error) {
      trackEvent('login_error', {
        error_code: error.code,
        error_message: error.message
      });
      throw error;
    }
  }

  async function loginWithApple() {
    try {
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');
      const result = await signInWithPopup(auth, provider);
      trackEvent('user_login', {
        method: 'apple',
        user_id: result.user.uid
      });
      return result;
    } catch (error) {
      trackEvent('login_error', {
        error_code: error.code,
        error_message: error.message
      });
      throw error;
    }
  }

  async function logout() {
    try {
      await signOut(auth);
      trackEvent('user_logout', {
        user_id: currentUser?.uid
      });
    } catch (error) {
      trackEvent('logout_error', {
        error_code: error.code,
        error_message: error.message
      });
      throw error;
    }
  }

  async function resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      trackEvent('password_reset_request', {
        email: email
      });
    } catch (error) {
      trackEvent('password_reset_error', {
        error_code: error.code,
        error_message: error.message
      });
      throw error;
    }
  }

  async function updateDisplayName(displayName) {
    if (!currentUser) throw new Error('No user logged in');
    try {
      // Update Firebase Auth profile
      await updateProfile(currentUser, { displayName });
      
      // Update Firestore user document
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { displayName });
      
      trackEvent('profile_update', {
        user_id: currentUser.uid,
        update_type: 'display_name'
      });
      
      // Note: Don't manually update currentUser here - let the onSnapshot listener handle it
    } catch (error) {
      trackEvent('profile_update_error', {
        error_code: error.code,
        error_message: error.message
      });
      throw error;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, get their Firestore data
        const userRef = doc(db, 'users', user.uid);
        const unsubscribeSnapshot = onSnapshot(userRef, async (doc) => {
          if (doc.exists()) {
            const firestoreData = doc.data();
            
            // Check if Firebase Auth email differs from Firestore email
            // This happens when email is updated via verification
            if (user.email && firestoreData.email !== user.email) {
              console.log('Email mismatch detected. Syncing Firestore with Firebase Auth email:', user.email);
              try {
                // Update Firestore with the new verified email
                await updateDoc(userRef, { 
                  email: user.email,
                  updatedAt: new Date()
                });
                // Update local data to reflect the change
                firestoreData.email = user.email;
                firestoreData.updatedAt = new Date();
              } catch (error) {
                console.error('Failed to sync email to Firestore:', error);
              }
            }
            
            // Create a new object that inherits from the original user object,
            // then assign the Firestore data to it. This preserves methods
            // like getIdToken() while adding custom profile data.
            const newCurrentUser = Object.assign(
              Object.create(user), 
              firestoreData
            );
            setCurrentUser(newCurrentUser);
            
            // Set Sentry user context
            setUserContext({
              uid: user.uid,
              email: user.email,
              displayName: firestoreData.displayName,
              plan: firestoreData.plan
            });
          } else {
            // This can happen if the user document is not yet created
            setCurrentUser(user);
          }
          setLoading(false);
        });
        
        trackEvent('auth_state_change', {
          type: 'login',
          user_id: user.uid
        });

        return () => unsubscribeSnapshot();
      } else {
        // User is signed out
        setCurrentUser(null);
        setLoading(false);
        trackEvent('auth_state_change', {
          type: 'logout'
        });
        
        // Clear Sentry user context
        try {
          setUserContext(null);
        } catch (error) {
          console.warn('Error clearing Sentry user context:', error);
        }
      }
    });

    return unsubscribe;
  }, [trackEvent]);

  const value = {
    currentUser,
    signup,
    login,
    loginWithGoogle,
    loginWithApple,
    logout,
    resetPassword,
    updateDisplayName
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 