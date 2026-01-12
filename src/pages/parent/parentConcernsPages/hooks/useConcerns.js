import { useState, useEffect, useCallback } from 'react';
import concernService from '../../../../services/concernService';
import childService from '../../../../services/childService';

/**
 * Custom hook for managing parent concerns
 * - Fetches concerns list
 * - Creates concerns
 * - Sends replies (messages subcollection)
 */
const useConcerns = (userId) => {
  // =======================
  // STATE
  // =======================
  const [concerns, setConcerns] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedConcern, setSelectedConcern] = useState(null);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  // =======================
  // FETCH INITIAL DATA
  // =======================
 const fetchData = useCallback(async () => {
  if (!userId) return;
  setLoading(true);
  setError(null);
  try {
    const [concernData, childData] = await Promise.all([
      concernService.getConcernsByParent(userId), // messages now included
      childService.getChildrenByParentId(userId)
    ]);
    setConcerns(concernData);
    setChildren(childData);
  } catch (err) {
    setError("Failed to load concerns. Please try again.");
  } finally {
    setLoading(false);
  }
}, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // =======================
  // CREATE CONCERN
  // =======================
  const createConcern = useCallback(async (concernData, parentInfo) => {
    if (!concernData.childId || !concernData.message.trim()) {
      throw new Error('Child and message are required');
    }

    setSending(true);

    try {
      const child = children.find(c => c.id === concernData.childId);
      if (!child) throw new Error('Child not found');

      await concernService.createConcern({
        parentId: parentInfo.uid,
        parentName: `${parentInfo.firstName} ${parentInfo.lastName}`,
        childId: child.id,
        childName: `${child.firstName} ${child.lastName}`,
        subject: concernData.subject || 'General Concern',
        message: concernData.message
      });

      await fetchData();
      return true;
    } catch (err) {
      console.error('Error creating concern:', err);
      throw err;
    } finally {
      setSending(false);
    }
  }, [children, fetchData]);

  // =======================
  // SEND REPLY (SUBCOLLECTION)
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
        'parent'
      );

      // Update metadata list only
      await fetchData();

      return true;
    } catch (err) {
      console.error('Error sending reply:', err);
      throw err;
    } finally {
      setSending(false);
    }
  }, [fetchData]);

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
    fetchData();
  }, [fetchData]);

  // =======================
  // RETURN API
  // =======================
  return {
    concerns,
    children,
    selectedConcern,

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

export default useConcerns;
