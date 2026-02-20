import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth } from '../config/firebase';
import { apiRequest } from '../services/apiConfig';

const db = getFirestore();

function useCreateUserInFirestore() {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          const displayName = user.displayName || (user.email ? user.email.split('@')[0] : 'Apple User');
          await setDoc(userRef, {
            email: user.email,
            displayName,
            subscriptionStatus: 'inactive',
            credits: 0,
            plan: 'none',
            isAdmin: false,
            createdAt: serverTimestamp(),
          });

          // Trigger welcome email
            try {
              await apiRequest('api/welcome', {
            method: 'POST',
            body: JSON.stringify({
              email: user.email,
              name: displayName,
            }),
          });
            } catch (emailError) {
              console.error('Failed to send welcome email:', emailError);
              // Don't throw error - user creation should still succeed
            }
          }
        } catch (error) {
          console.error('Error creating user in Firestore:', error);
        }
      }
    });
    return unsubscribe;
  }, []);
}

export default useCreateUserInFirestore; 