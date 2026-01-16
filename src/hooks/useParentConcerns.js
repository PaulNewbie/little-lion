import { useState, useEffect, useCallback } from 'react';
import concernService from '../services/concernService';
import childService from '../services/childService';

/**
 * Custom hook for managing parent concerns
 * - Real-time listening to parent's concerns
 * - Real-time listening to messages
 * - Creates concerns
 * - Sends replies
 */
const useParentConcerns = (userId) => {
  // =======================
  // STATE
  // =======================
  const [concerns, setConcerns] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedConcern, setSelectedConcern] = useState(null);
  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  // =======================
  // FETCH CHILDREN (One-time)
  // =======================
  useEffect(() => {
    const fetchChildren = async () => {
      if (!userId) return;
      
      try {
        const childData = await childService.getChildrenByParentId(userId);
        setChildren(childData);
      } catch (err) {
        console.error('Error fetching children:', err);
        setError('Failed to load children');
      }
    };

    fetchChildren();
  }, [userId]);

  // =======================
  // LISTEN TO CONCERNS (Real-time)
  // =======================
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = concernService.listenToConcernsByParent(userId, (concernsData) => {
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
  }, [userId]);

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
  // CREATE CONCERN
  // =======================
  const createConcern = useCallback(async (concernData, userInfo) => {
    if (!concernData.childId || !concernData.message.trim()) {
      throw new Error('Child and message are required');
    }

    setSending(true);
    setError(null);

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

      // No need to manually refresh - snapshot listener will update automatically
      return true;
    } catch (err) {
      console.error('Error creating concern:', err);
      setError('Failed to create concern');
      throw err;
    } finally {
      setSending(false);
    }
  }, [children]);

  // =======================
  // SEND REPLY
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
        'parent'
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