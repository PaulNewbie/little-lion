// src/hooks/useManageTherapists.js
// UPDATED: Uses optimized queries and caching

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useStaff, useServices } from './useRoleBasedData';
import { QUERY_KEYS, invalidateRelatedCaches } from '../config/queryClient';
import authService from '../services/authService';
import userService from '../services/userService';

const useManageTherapists = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState(null);

  // Using optimized hooks instead of direct queries
  const { 
    data: therapists = [], 
    isLoading: loadingTherapists 
  } = useStaff({ role: 'therapist' });

  const { 
    data: services = [], 
    isLoading: loadingServices 
  } = useServices({ type: 'Therapy' });

  const loading = loadingTherapists || loadingServices;

  // Form state
  const [newTherapist, setNewTherapist] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    phone: '',
    specializations: []
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTherapist(prev => ({ ...prev, [name]: value }));
  };

  const toggleSpecialization = (serviceName) => {
    setNewTherapist(prev => {
      const specs = prev.specializations.includes(serviceName)
        ? prev.specializations.filter(s => s !== serviceName)
        : [...prev.specializations, serviceName];
      return { ...prev, specializations: specs };
    });
  };

  const createTherapist = async (e) => {
    if (e) e.preventDefault();
    setError(null);

    try {
      const result = await authService.createTherapistAccount(
        newTherapist.email, 
        newTherapist
      );

      // Reset form
      setNewTherapist({
        firstName: '',
        lastName: '',
        middleName: '',
        email: '',
        phone: '',
        specializations: []
      });

      // Invalidate caches using optimized helper
      await invalidateRelatedCaches('therapist');

      return { success: true, user: result };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const updateTherapist = async (therapistId, updates) => {
    try {
      await userService.updateUser(therapistId, updates);
      await invalidateRelatedCaches('therapist', therapistId);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  return {
    therapists,
    services,
    loading,
    error,
    newTherapist,
    handleInputChange,
    toggleSpecialization,
    createTherapist,
    updateTherapist,
  };
};

export default useManageTherapists;
