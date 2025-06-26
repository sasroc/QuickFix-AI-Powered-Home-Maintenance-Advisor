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
            await setDoc(userRef, {
              email: user.email,
              displayName: user.displayName || user.email.split('@')[0],
              subscriptionStatus: 'inactive',
              credits: 0,
              plan: 'starter',
              isAdmin: false,
              createdAt: serverTimestamp(),
            });
            
            // Trigger welcome email
            try {
              await apiRequest('api/welcome', {
                method: 'POST',
                body: JSON.stringify({
                  email: user.email,
                  name: user.displayName || user.email.split('@')[0],
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