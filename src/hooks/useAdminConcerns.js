import { useState, useEffect, useCallback } from 'react';
import concernService from '../services/concernService';

/**
 * Custom hook for managing ADMIN concerns
 * - Real-time listening to ALL concerns
 * - Real-time listening to messages
 * - Sends admin replies
 * - Updates concern status
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
  // LISTEN TO ALL CONCERNS (Real-time)
  // =======================
  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = concernService.listenToAllConcerns((concernsData) => {
      setConcerns(concernsData);
      setLoading(false);
      
      // Update selected concern if it exists in the new data
      setSelectedConcern(prevSelected => {
        if (!prevSelected) return null;
        return concernsData.find(c => c.id === prevSelected.id) || null;
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // =======================
  // LISTEN TO MESSAGES (Real-time)
  // =======================
  useEffect(() => {
    if (!selectedConcern) {
      setMessages([]);
      return;
    }

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
    setError(null);
    
    try {
      await concernService.addMessageToConcern(
        concernId,
        replyText,
        senderInfo,
        'admin'
      );
      return true;
    } catch (err) {
      console.error('Error sending reply:', err);
      setError('Failed to send reply');
      throw err;
    } finally {
      setSending(false);
    }
  }, []);

  // =======================
  // UPDATE STATUS
  // =======================
  const updateStatus = useCallback(async (concernId, status) => {
    setError(null);
    
    try {
      await concernService.updateConcernStatus(concernId, status);
      // No need to manually refresh - snapshot listener will update automatically
      return true;
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status');
      throw err;
    }
  }, []);

  // =======================
  // UI HELPERS
  // =======================
  const selectConcern = useCallback((concern) => {
    setSelectedConcern(concern);
    setError(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedConcern(null);
    setMessages([]);
    setError(null);
  }, []);

  const refresh = useCallback(() => {
    // With real-time listeners, manual refresh is not needed
    // But we keep this for API compatibility
    console.log('Refresh called - using real-time listeners, no action needed');
  }, []);

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
    refresh,
    updateStatus
  };
};

export default useAdminConcerns;