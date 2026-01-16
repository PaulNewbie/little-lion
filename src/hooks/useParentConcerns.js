import { useState, useEffect, useCallback } from 'react';
import concernService from '../services/concernService';
import childService from '../services/childService';

/**
 * Custom hook for managing parent concerns
 * ✅ UPDATED: Added client-side sorting by lastUpdated
 */
const useParentConcerns = (userId) => {
  // =======================
  // STATE (UNCHANGED)
  // =======================
  const [concerns, setConcerns] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedConcern, setSelectedConcern] = useState(null);
  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  // =======================
  // FETCH CHILDREN (UNCHANGED)
  // =======================
  const fetchChildren = useCallback(async () => {
    if (!userId) return;
    try {
      const childData = await childService.getChildrenByParentId(userId);
      setChildren(childData);
    } catch (err) {
      setError("Failed to load children. Please try again.");
    }
  }, [userId]);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  // =======================
  // LISTEN TO CONCERNS (✅ UPDATED WITH CLIENT-SIDE SORTING)
  // =======================
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = concernService.listenToConcernsByParent(
      userId,
      (concernsData) => {
        // ✅ Sort client-side by lastUpdated (most recent first)
        const sortedConcerns = concernsData.sort((a, b) => {
          const aTime = a.lastUpdated?.toMillis?.() || a.lastUpdated || 0;
          const bTime = b.lastUpdated?.toMillis?.() || b.lastUpdated || 0;
          return bTime - aTime; // Descending order (most recent first)
        });
        
        setConcerns(sortedConcerns);
        setLoading(false);
      }
    );

    // Cleanup on unmount
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
  // SELECT CONCERN (UNCHANGED)
  // =======================
  const selectConcern = useCallback((concern) => {
    setSelectedConcern(concern);
  }, []);


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