import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import concernService from '../services/concernService';
const UnreadConcernsContext = createContext({ unreadCount: 0 });

/**
 * Provider that tracks unread concerns count for admins
 * Uses real-time Firestore listener
 */
export const UnreadConcernsProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  useEffect(() => {
    // Only listen for admins
    if (!isAdmin || !currentUser?.uid) {
      setUnreadCount(0);
      return;
    }

    const unsubscribe = concernService.listenToAllConcerns((concerns) => {
      // Count concerns that are unread for this admin
      const count = concerns.filter(concern => {
        if (!concern.lastUpdated) return false;

        const lastReadAt = concern.lastReadBy?.[currentUser.uid];
        if (!lastReadAt) return true; // Never read = unread

        // Handle pending serverTimestamp - if lastReadAt exists but doesn't have toMillis,
        // it's a pending write, so consider it as read (not unread)
        if (typeof lastReadAt?.toMillis !== 'function') {
          return false;
        }

        const lastReadTime = lastReadAt.toMillis();
        const lastUpdatedTime = concern.lastUpdated?.toMillis?.() || 0;

        return lastUpdatedTime > lastReadTime;
      }).length;

      setUnreadCount(count);
    });

    return () => unsubscribe();
  }, [isAdmin, currentUser?.uid]);

  return (
    <UnreadConcernsContext.Provider value={{ unreadCount }}>
      {children}
    </UnreadConcernsContext.Provider>
  );
};

/**
 * Hook to get unread concerns count
 */
export const useUnreadConcerns = () => {
  return useContext(UnreadConcernsContext);
};
