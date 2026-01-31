import { useState, useEffect, useCallback, useRef } from 'react';
import concernService from '../services/concernService';

/**
 * Custom hook for managing ADMIN concerns
 * Includes real-time notifications for new concerns
 */
const useAdminConcerns = (userId) => {
  // =======================
  // STATE
  // =======================
  const [concerns, setConcerns] = useState([]);
  const [selectedConcern, setSelectedConcern] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newConcernAlert, setNewConcernAlert] = useState(null);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  // Track known concern IDs to detect new ones
  const knownConcernIds = useRef(new Set());
  const isInitialLoad = useRef(true);

  // Track locally read concerns to prevent flicker
  const [locallyReadIds, setLocallyReadIds] = useState(new Set());

  // =======================
  // LISTEN TO ALL CONCERNS WITH NEW CONCERN DETECTION
  // =======================
  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = concernService.listenToAllConcerns((concernsData) => {
      // Detect new concerns (only after initial load)
      if (!isInitialLoad.current) {
        const newConcerns = concernsData.filter(
          c => !knownConcernIds.current.has(c.id)
        );

        if (newConcerns.length > 0) {
          // Get the most recent new concern for the alert
          const latestNew = newConcerns[0];
          setNewConcernAlert({
            id: latestNew.id,
            parentName: latestNew.createdByUserName,
            childName: latestNew.childName,
            subject: latestNew.subject,
            count: newConcerns.length
          });
        }
      }

      // Update known IDs
      knownConcernIds.current = new Set(concernsData.map(c => c.id));
      isInitialLoad.current = false;

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
    // Mark as locally read immediately to prevent flicker
    if (concern?.id) {
      setLocallyReadIds(prev => new Set([...prev, concern.id]));
    }
    // Mark concern as read in Firestore
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

  // Clear the new concern alert after it's been shown
  const clearNewConcernAlert = useCallback(() => {
    setNewConcernAlert(null);
  }, []);

  // =======================
  // RETURN API
  // =======================
  return {
    concerns,
    children: [], // admin doesn't need children, but keeps API consistent
    selectedConcern,
    messages,
    newConcernAlert,
    locallyReadIds,

    loading,
    sending,
    error,

    createConcern: null, // admin cannot create concerns
    sendReply,
    selectConcern,
    clearSelection,
    refresh,
    updateStatus,
    clearNewConcernAlert
  };
};

export default useAdminConcerns;