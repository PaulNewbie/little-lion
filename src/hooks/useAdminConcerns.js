import { useState, useEffect, useCallback } from 'react';
import concernService from '../services/concernService';

/**
 * Custom hook for managing ADMIN concerns
 * MINIMAL CHANGE VERSION - Just converted to snapshots
 */
const useAdminConcerns = (userId) => {
  // =======================
  // STATE (UNCHANGED)
  // =======================
  const [concerns, setConcerns] = useState([]);
  const [selectedConcern, setSelectedConcern] = useState(null);
  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  // =======================
  // LISTEN TO ALL CONCERNS (CHANGED FROM fetchConcerns TO SNAPSHOT)
  // =======================
  useEffect(() => {
    setLoading(true);
    setError(null);

    // Changed from getDocs to onSnapshot
    const unsubscribe = concernService.listenToAllConcerns((concernsData) => {
      setConcerns(concernsData);
      setLoading(false);
    });

    // Cleanup on unmount
    return () => unsubscribe();
  }, []);

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
  // SEND ADMIN REPLY (UNCHANGED)
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
  // UPDATE STATUS (CHANGED - REMOVED fetchConcerns CALL)
  // =======================
  const updateStatus = useCallback(async (concernId, status) => {
      // 1️⃣ Optimistically update local state
      setConcerns(prev =>
        prev.map(c =>
          c.id === concernId ? { ...c, status } : c
        )
      );  

    try {
      // 2️⃣ Persist to Firestore
      await concernService.updateConcernStatus(concernId, status);
    } catch (err) {
      console.error('Failed to update status:', err);
      // (optional) rollback if needed
    }
  }, []);


  // =======================
  // UI HELPERS (UPDATED: Mark as read)
  // =======================
  const selectConcern = useCallback((concern) => {
    setSelectedConcern(concern);
    // Mark concern as read for this admin
    if (concern?.id && userId) {
      concernService.markConcernAsRead(concern.id, userId);
    }
  }, [userId]);

  const clearSelection = useCallback(() => {
    setSelectedConcern(null);
    setMessages([]);
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
    refresh,
    updateStatus
  };
};

export default useAdminConcerns;