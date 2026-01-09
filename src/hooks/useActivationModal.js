// src/hooks/useActivationModal.js

import { useState, useCallback } from 'react';

/**
 * Hook to manage the activation modal state after creating user accounts
 * Use this in any admin page that creates new users
 * 
 * Usage:
 * const { 
 *   showModal, 
 *   modalUser, 
 *   openModal, 
 *   closeModal 
 * } = useActivationModal();
 * 
 * // After creating a user:
 * const result = await authService.createParentAccount(email, data);
 * openModal(result); // result should contain { uid, firstName, lastName, email, activationCode }
 * 
 * // In JSX:
 * <ActivationModal 
 *   isOpen={showModal} 
 *   onClose={closeModal} 
 *   userData={modalUser} 
 * />
 */
export function useActivationModal() {
  const [showModal, setShowModal] = useState(false);
  const [modalUser, setModalUser] = useState(null);

  const openModal = useCallback((userData) => {
    setModalUser(userData);
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    // Optionally clear user data after a delay (for animation)
    setTimeout(() => setModalUser(null), 300);
  }, []);

  return {
    showModal,
    modalUser,
    openModal,
    closeModal
  };
}

export default useActivationModal;