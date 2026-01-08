// src/hooks/useManageTherapists.js

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import userService from '../services/userService';
import authService from '../services/authService';
import servicesService from '../services/offeringsService';

const useManageTherapists = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState(null);

  // --- QUERY 1: Fetch Therapists ---
  const { 
    data: therapists = [], 
    isLoading: loadingTherapists 
  } = useQuery({
    queryKey: ['therapists'], 
    queryFn: () => userService.getUsersByRole('therapist'),
    staleTime: 1000 * 60 * 5,
  });

  // --- QUERY 2: Fetch Therapy Services ---
  const { 
    data: services = [], 
    isLoading: loadingServices 
  } = useQuery({
    queryKey: ['services', 'Therapy'], 
    queryFn: () => servicesService.getServicesByType('Therapy'),
    staleTime: 1000 * 60 * 5,
  });

  const loading = loadingTherapists || loadingServices;

  // REMOVED: generatePassword function - no longer needed!

  // Form state - NO password field!
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

  // --- ACTIONS ---

  /**
   * Create a new therapist account
   * Returns the created user data INCLUDING activationCode for the modal
   */
  const createTherapist = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      // UPDATED: No password parameter - authService handles it securely
      const result = await authService.createTherapistAccount(newTherapist.email, {
        firstName: newTherapist.firstName,
        lastName: newTherapist.lastName,
        middleName: newTherapist.middleName,
        phone: newTherapist.phone,
        specializations: newTherapist.specializations,
      });
      
      // Refresh the list
      await queryClient.invalidateQueries({ queryKey: ['therapists'] });

      // Reset form
      setNewTherapist({ 
        firstName: '', 
        lastName: '', 
        middleName: '',
        email: '', 
        phone: '', 
        specializations: [] 
      });
      
      // Return the result so the component can show the activation modal
      return {
        success: true,
        user: {
          uid: result.uid,
          firstName: newTherapist.firstName,
          lastName: newTherapist.lastName,
          email: newTherapist.email,
          activationCode: result.activationCode
        }
      };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const deleteTherapist = async (id) => {
    if (!window.confirm('Are you sure you want to delete this therapist?')) return;
    try {
      await userService.deleteUser(id);
      await queryClient.invalidateQueries({ queryKey: ['therapists'] });
    } catch (err) {
      setError(err.message);
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
    deleteTherapist
  };
};

export default useManageTherapists;