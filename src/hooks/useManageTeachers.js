// src/hooks/useManageTeachers.js

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import userService from '../services/userService';
import authService from '../services/authService';
import servicesService from '../services/offeringsService';

const useManageTeachers = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState(null);

  // --- QUERY 1: Fetch Teachers (Cached) ---
  const { 
    data: teachers = [], 
    isLoading: loadingTeachers 
  } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => userService.getUsersByRole('teacher'),
    staleTime: 1000 * 60 * 5,
  });

  // --- QUERY 2: Fetch Class Services (Cached) ---
  const { 
    data: services = [], 
    isLoading: loadingServices 
  } = useQuery({
    queryKey: ['services', 'Class'],
    queryFn: () => servicesService.getServicesByType('Class'),
    staleTime: 1000 * 60 * 5,
  });

  const loading = loadingTeachers || loadingServices;

  // REMOVED: generatePassword function - no longer needed!

  // Form state - NO password field!
  const [newTeacher, setNewTeacher] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specializations: []
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTeacher(prev => ({ ...prev, [name]: value }));
  };

  const toggleSpecialization = (serviceName) => {
    setNewTeacher(prev => {
      const specs = prev.specializations.includes(serviceName)
        ? prev.specializations.filter(s => s !== serviceName)
        : [...prev.specializations, serviceName];
      return { ...prev, specializations: specs };
    });
  };

  // --- ACTIONS ---
  
  /**
   * Create a new teacher account
   * Returns the created user data INCLUDING activationCode for the modal
   */
  const createTeacher = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      // UPDATED: No password parameter - authService handles it securely
      const result = await authService.createTeacherAccount(newTeacher.email, {
        firstName: newTeacher.firstName,
        lastName: newTeacher.lastName,
        phone: newTeacher.phone,
        specializations: newTeacher.specializations,
      });
      
      // Refresh the list
      await queryClient.invalidateQueries({ queryKey: ['teachers'] });

      // Reset form
      setNewTeacher({ 
        firstName: '', 
        lastName: '', 
        email: '', 
        phone: '', 
        specializations: [] 
      });
      
      // Return the result so the component can show the activation modal
      return {
        success: true,
        user: {
          uid: result.uid,
          firstName: newTeacher.firstName,
          lastName: newTeacher.lastName,
          email: newTeacher.email,
          activationCode: result.activationCode
        }
      };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const deleteTeacher = async (id) => {
    if (!window.confirm('Are you sure you want to delete this teacher?')) return;
    try {
      await userService.deleteUser(id);
      await queryClient.invalidateQueries({ queryKey: ['teachers'] });
    } catch (err) {
      setError(err.message);
    }
  };

  return {
    teachers,
    services,
    loading,
    error,
    newTeacher,
    handleInputChange,
    toggleSpecialization,
    createTeacher,
    deleteTeacher
  };
};

export default useManageTeachers;