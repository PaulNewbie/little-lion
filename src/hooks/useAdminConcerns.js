import { useState, useEffect, useCallback } from 'react';
import concernService from '../services/concernService';

/**
 * Custom hook for managing ADMIN concerns
 * - Fetches ALL concerns
 * - Listens to messages
 * - Sends admin replies
 * - Admin DOES NOT create concerns
 */
const useAdminConcerns = () => {
  // =======================
  // STATE
  // =======================
  const [concerns, setConcerns] = useState([]);
  const [selectedConcern, setSelectedConcern] = useState(null);
  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  // =======================
  // FETCH ALL CONCERNS
  // =======================
  const fetchConcerns = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await concernService.getAllConcerns();
      setConcerns(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load concerns.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConcerns();
  }, [fetchConcerns]);

  // =======================
  // REALTIME MESSAGES
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
  // SEND ADMIN REPLY
  // =======================
  const sendReply = useCallback(async (concernId, replyText, senderInfo) => {
    if (!replyText.trim()) {
      throw new Error('Reply text is required');
    }

    setSending(true);
    try {
      await concernService.addMessageToConcern(
        concernId,
        replyText,
        senderInfo,
        'admin'
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
    setMessages([]);
  }, []);

  const refresh = useCallback(() => {
    fetchConcerns();
  }, [fetchConcerns]);

  // =======================
  // RETURN API (SAME SHAPE)
  // =======================
  return {
    concerns,
    children: [], // admin doesn't need children, but keeps API consistent
    selectedConcern,
    messages,

    loading,
    sending,
    error,

    createConcern: null, // admin cannot create concerns
    sendReply,
    selectConcern,
    clearSelection,
    refresh
  };
};

export default useAdminConcerns;
