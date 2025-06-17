import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { auth } from '../config/firebase';
import useAnalytics from '../hooks/useAnalytics';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

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
    await updateProfile(currentUser, { displayName });
      trackEvent('profile_update', {
        user_id: currentUser.uid,
        update_type: 'display_name'
      });
    // Force a refresh of the current user to update the display name
    setCurrentUser({ ...currentUser, displayName });
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
      setCurrentUser(user);
      setLoading(false);
      if (user) {
        trackEvent('auth_state_change', {
          type: 'login',
          user_id: user.uid
        });
      } else {
        trackEvent('auth_state_change', {
          type: 'logout'
        });
      }
    });

    return unsubscribe;
  }, [trackEvent]);

  const value = {
    currentUser,
    signup,
    login,
    loginWithGoogle,
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