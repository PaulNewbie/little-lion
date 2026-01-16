import { useState, useEffect, useCallback } from 'react';
import concernService from '../services/concernService';
import childService from '../services/childService';

/**
 * Custom hook for managing parent concerns
 * MINIMAL CHANGE VERSION - Just converted to snapshots
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
  // LISTEN TO CONCERNS (CHANGED FROM fetchData TO SNAPSHOT)
  // =======================
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Changed from getDocs to onSnapshot
    const unsubscribe = concernService.listenToConcernsByParent(
      userId,
      (concernsData) => {
        setConcerns(concernsData);
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
  // CREATE CONCERN (CHANGED - REMOVED fetchData CALL)
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

      // REMOVED: await fetchData();
      // Snapshot listener will auto-update!
      return true;
    } catch (err) {
      console.error('Error creating concern:', err);
      throw err;
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
  // UI HELPERS (UNCHANGED)
  // =======================
  const selectConcern = useCallback((concern) => {
    setSelectedConcern(concern);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedConcern(null);
  }, []);

  const refresh = useCallback(() => {
    // With snapshots, this does nothing
    // But kept for API compatibility
  }, []);

  // =======================
  // RETURN API (UNCHANGED)
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
    refresh
  };
};

export default useParentConcerns;