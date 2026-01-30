import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userData = await authService.getUserData(user.uid);
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            ...userData
          });
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



