import React, { createContext, useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import authService from '../services/authService';
import { setErrorUser, clearErrorUser } from '../config/errorReporting';

export const AuthContext = createContext();

// Backfill childrenIds on parent's user doc so Firestore rules can verify access
const backfillChildrenIds = async (uid) => {
  try {
    const q = query(collection(db, 'children'), where('parentId', '==', uid));
    const snapshot = await getDocs(q);
    const ids = snapshot.docs.map(d => d.id);
    if (ids.length > 0) {
      await updateDoc(doc(db, 'users', uid), { childrenIds: ids });
    }
    return ids;
  } catch (error) {
    console.error('childrenIds backfill failed:', error);
    return [];
  }
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userData = await authService.getUserData(user.uid);

          // Auto-backfill childrenIds for parents (required by Firestore rules)
          if (userData.role === 'parent') {
            const hasChildrenIds = Array.isArray(userData.childrenIds) && userData.childrenIds.length > 0;
            if (!hasChildrenIds) {
              const ids = await backfillChildrenIds(user.uid);
              userData.childrenIds = ids;
            }
          }

          const fullUser = {
            uid: user.uid,
            email: user.email,
            ...userData
          };
          setCurrentUser(fullUser);
          setErrorUser(fullUser);
        } catch (error) {
          console.error('Error fetching user data:', error);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    return await authService.signIn(email, password);
  };

  const logout = async () => {
    await authService.signOut();
    setCurrentUser(null);
    clearErrorUser();
  };

  // Refresh user data from Firestore (useful after profile updates)
  const refreshUser = async () => {
    if (currentUser?.uid) {
      try {
        const userData = await authService.getUserData(currentUser.uid);
        setCurrentUser(prev => ({
          ...prev,
          ...userData
        }));
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    }
  };

  const value = {
    currentUser,
    loading,
    login,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};



