import { useState, useEffect, useCallback } from 'react';
import concernService from '../services/concernService';
import childService from '../services/childService';

/**
 * Custom hook for managing parent concerns
 * Fetches children directly to avoid caching issues on navigation
 */
const useParentConcerns = (userId) => {
  // =======================
  // STATE
  // =======================
  const [concerns, setConcerns] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedConcern, setSelectedConcern] = useState(null);
  const [messages, setMessages] = useState([]);

  const [concernsLoading, setConcernsLoading] = useState(true);
  const [childrenLoading, setChildrenLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  // Combined loading state
  const loading = concernsLoading || childrenLoading;

  // =======================
  // FETCH CHILDREN DIRECTLY (avoids cache issues)
  // =======================
  useEffect(() => {
    if (!userId) {
      setChildrenLoading(false);
      return;
    }

    let cancelled = false;
    setChildrenLoading(true);

    const fetchChildren = async () => {
      try {
        const data = await childService.getChildrenByParentId(userId);
        if (cancelled) return;

        // Deduplicate children by ID
        const uniqueChildren = data?.length > 0
          ? [...new Map(data.map(child => [child.id, child])).values()]
          : [];
        setChildren(uniqueChildren);
      } catch (err) {
        if (!cancelled) {
          setError("Failed to load children. Please try again.");
          setChildren([]);
        }
      } finally {
        if (!cancelled) setChildrenLoading(false);
      }
    };

    fetchChildren();
    return () => { cancelled = true; };
  }, [userId]);

  // =======================
  // LISTEN TO CONCERNS (Real-time with client-side sorting)
  // =======================
  useEffect(() => {
    if (!userId) {
      setConcernsLoading(false);
      return;
    }

    setConcernsLoading(true);

    const unsubscribe = concernService.listenToConcernsByParent(
      userId,
      (concernsData) => {
        // Sort client-side by lastUpdated (most recent first)
        const sortedConcerns = concernsData.sort((a, b) => {
          const aTime = a.lastUpdated?.toMillis?.() || a.lastUpdated || 0;
          const bTime = b.lastUpdated?.toMillis?.() || b.lastUpdated || 0;
          return bTime - aTime;
        });

        setConcerns(sortedConcerns);
        setConcernsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // =======================
  // LISTEN TO MESSAGES (UNCHANGED - ALREADY HAD SNAPSHOT)
  // =======================
  useEffect(() => {
    if (!selectedConcern) return;

    const unsubscribe = concernService.listenToConcernMessages(
      selectedConcern.id,
      setMessages
    );

    return () => unsubscribe();
  }, [selectedConcern]);

  // =======================
  // CREATE CONCERN (UNCHANGED)
  // =======================
  const createConcern = useCallback(async (concernData, userInfo) => {
    if (!concernData.childId || !concernData.message.trim()) {
      throw new Error('Child and message are required');
    }

    setSending(true);

    try {
      const child = children.find(c => c.id === concernData.childId);
      if (!child) throw new Error('Child not found');

      await concernService.createConcern({
        createdByUserId: userInfo.uid,
        createdByUserName: `${userInfo.firstName} ${userInfo.lastName}`,
        childId: child.id,
        childName: `${child.firstName} ${child.lastName}`,
        subject: concernData.subject || 'General Concern',
        message: concernData.message
      });

      // Snapshot listener will auto-update!
    } catch (err) {
      throw new Error('Failed to create concern: ' + err.message);
    } finally {
      setSending(false);
    }
  }, [children]);

  // =======================
  // SEND REPLY (UNCHANGED)
  // =======================
 const sendReply = useCallback(async (concernId, replyText, senderInfo) => {
    if (!replyText.trim()) throw new Error('Reply text is required');

    setSending(true);
    try {
      await concernService.addMessageToConcern(
        concernId,
        replyText,
        senderInfo,
        'parent'
      );
      return true;
    } finally {
      setSending(false);
    }
  }, []);

  // =======================
  // SELECT CONCERN (UPDATED: Mark as read)
  // =======================
  const selectConcern = useCallback((concern) => {
    setSelectedConcern(concern);
    // Mark concern as read for this user
    if (concern?.id && userId) {
      concernService.markConcernAsRead(concern.id, userId);
    }
  }, [userId]);


  //UI HELPERS
  const clearSelection = useCallback(() => {
    setSelectedConcern(null);
    setMessages([]);
  }, []);

  // =======================
  // RETURN VALUES
  // =======================
  return {
    concerns,
    children,
    selectedConcern,
    messages,
    loading,
    sending,
    error,
    createConcern,
    sendReply,
    selectConcern,
    clearSelection,
    setError
  };
};

export default useParentConcerns;