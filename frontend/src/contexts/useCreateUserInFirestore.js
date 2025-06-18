import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth } from '../config/firebase';

const db = getFirestore();

function useCreateUserInFirestore() {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            email: user.email,
            subscriptionStatus: 'inactive',
            createdAt: serverTimestamp(),
          });
          // Trigger welcome email
          fetch('/api/welcome', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              name: user.displayName || user.email.split('@')[0],
            }),
          });
        }
      }
    });
    return unsubscribe;
  }, []);
}

export default useCreateUserInFirestore; 