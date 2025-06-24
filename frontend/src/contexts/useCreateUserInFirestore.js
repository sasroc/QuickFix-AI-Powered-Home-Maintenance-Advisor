import { useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { apiRequest } from '../services/apiConfig';

const db = getFirestore();

export default function useCreateUserInFirestore() {
  const { currentUser } = useAuth();

  useEffect(() => {
    const createUser = async () => {
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              email: currentUser.email,
              displayName: currentUser.displayName || '',
              plan: 'starter',
              credits: 3,
              createdAt: new Date(),
              subscriptionStatus: 'inactive'
            });

            // Send welcome email
            try {
              await apiRequest('api/welcome', {
                method: 'POST',
                body: JSON.stringify({
                  email: currentUser.email,
                  name: currentUser.displayName || currentUser.email.split('@')[0]
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
    };

    createUser();
  }, [currentUser]);
} 