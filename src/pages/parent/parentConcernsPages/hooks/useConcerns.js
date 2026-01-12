import { useState, useEffect, useCallback } from 'react';
import inquiryService from '../../../../services/inquiryService';
import childService from '../../../../services/childService';

/**
 * Custom hook for managing parent concerns data and operations
 * Handles fetching, creating, and replying to concerns
 */
const useConcerns = (userId) => {
  // Data state
  const [concerns, setConcerns] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedConcern, setSelectedConcern] = useState(null);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch initial data - concerns and children
   */
  const fetchData = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [concernData, childData] = await Promise.all([
        inquiryService.getInquiriesByParent(userId),
        childService.getChildrenByParentId(userId)
      ]);
      setConcerns(concernData);
      setChildren(childData);
    } catch (err) {
      console.error("Failed to load concerns:", err);
      setError("Failed to load concerns. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Initial data fetch on mount
   */
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Create a new concern
   * @param {Object} concernData - { childId, subject, message }
   * @param {Object} parentInfo - { uid, firstName, lastName }
   */
  const createConcern = useCallback(async (concernData, parentInfo) => {
    if (!concernData.childId || !concernData.message.trim()) {
      throw new Error("Child and message are required");
    }

    setSending(true);
    
    try {
      const child = children.find(c => c.id === concernData.childId);
      if (!child) throw new Error("Child not found");

      const newConcern = {
        parentId: parentInfo.uid,
        parentName: `${parentInfo.firstName} ${parentInfo.lastName}`,
        childId: child.id,
        childName: `${child.firstName} ${child.lastName}`,
        subject: concernData.subject || 'General Concern',
        message: concernData.message,
      };

      await inquiryService.createInquiry(newConcern);
      
      // Refresh concerns list
      const updatedConcerns = await inquiryService.getInquiriesByParent(parentInfo.uid);
      setConcerns(updatedConcerns);
      
      return true;
    } catch (err) {
      console.error("Error creating concern:", err);
      throw err;
    } finally {
      setSending(false);
    }
  }, [children]);

  /**
   * Send a reply to an existing concern
   * @param {string} concernId - The concern to reply to
   * @param {string} replyText - The reply message
   * @param {Object} senderInfo - { id, name }
   */
  const sendReply = useCallback(async (concernId, replyText, senderInfo) => {
    if (!replyText.trim()) {
      throw new Error("Reply text is required");
    }

    // Check reply limit
    const concern = concerns.find(c => c.id === concernId);
    const parentReplyCount = concern?.messages?.filter(m => m.type === 'parent').length || 0;
    
    if (parentReplyCount >= 3) {
      throw new Error("Reply limit reached");
    }

    setSending(true);
    
    try {
      await inquiryService.addMessageToThread(
        concernId,
        replyText,
        senderInfo,
        'parent'
      );

      // Refresh concerns and update selected
      const updatedConcerns = await inquiryService.getInquiriesByParent(senderInfo.id);
      setConcerns(updatedConcerns);
      
      const updatedSelected = updatedConcerns.find(c => c.id === concernId);
      setSelectedConcern(updatedSelected);
      
      return true;
    } catch (err) {
      console.error("Error sending reply:", err);
      throw err;
    } finally {
      setSending(false);
    }
  }, [concerns]);

  /**
   * Select a concern for detailed view
   */
  const selectConcern = useCallback((concern) => {
    setSelectedConcern(concern);
  }, []);

  /**
   * Clear selected concern
   */
  const clearSelection = useCallback(() => {
    setSelectedConcern(null);
  }, []);

  /**
   * Refresh concerns data
   */
  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    // Data
    concerns,
    children,
    selectedConcern,
    
    // Loading states
    loading,
    sending,
    error,
    
    // Actions
    createConcern,
    sendReply,
    selectConcern,
    clearSelection,
    refresh
  };
};

export default useConcerns;
