import { useState, useEffect, useCallback } from 'react';
import concernService from '../services/concernService';
import { useChildrenByParent } from './useCachedData';

/**
 * Custom hook for managing parent concerns
 * - Fetches concerns list
 * - Creates concerns
 * - Sends replies (messages subcollection)
 * - Uses cached children data to prevent redundant reads
 */
const useParentConcerns = (userId) => {
  // =======================
  // STATE
  // =======================
  const [concerns, setConcerns] = useState([]);
  const [selectedConcern, setSelectedConcern] = useState(null);

  const [concernsLoading, setConcernsLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const [messages, setMessages] = useState([]);

  // Use cached children data - prevents re-fetching across parent pages
  const { data: children = [], isLoading: childrenLoading } = useChildrenByParent(userId);

  // Combined loading state
  const loading = concernsLoading || childrenLoading;

  // =======================
  // FETCH CONCERNS ONLY (children from cache)
  // =======================
  const fetchConcerns = useCallback(async () => {
    if (!userId) return;
    setConcernsLoading(true);
    setError(null);
    try {
      const concernData = await concernService.getConcernsByParent(userId);
      setConcerns(concernData);
    } catch (err) {
      setError("Failed to load concerns. Please try again.");
    } finally {
      setConcernsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchConcerns();
  }, [fetchConcerns]);

  useEffect(() => {
    if (!selectedConcern) return;

    const unsubscribe = concernService.listenToConcernMessages(
      selectedConcern.id,
      setMessages
    );

    return () => unsubscribe();
  }, [selectedConcern]);


  // =======================
  // CREATE CONCERN
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

      await fetchConcerns();
      return true;
    } catch (err) {
      console.error('Error creating concern:', err);
      throw err;
    } finally {
      setSending(false);
    }
  }, [children, fetchConcerns]);

  // =======================
  // SEND REPLY (SUBCOLLECTION)
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
  // UI HELPERS
  // =======================
  const selectConcern = useCallback((concern) => {
    setSelectedConcern(concern);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedConcern(null);
  }, []);

  const refresh = useCallback(() => {
    fetchConcerns();
  }, [fetchConcerns]);

  // =======================
  // RETURN API
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
