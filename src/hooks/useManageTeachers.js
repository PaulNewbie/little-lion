// src/hooks/useManageTeachers.js
// OPTIMIZED: Uses 'useCachedData' to share cache with Admin/Therapist pages

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTeachers, useServicesByType } from './useCachedData'; // IMPORT FROM UNIFIED CACHE
import { invalidateRelatedCaches } from '../config/queryClient';
import authService from '../services/authService';
import userService from '../services/userService';

const useManageTeachers = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState(null);

  // 1. USE UNIFIED CACHED HOOKS
  // This shares the ['users', 'teacher'] key with the rest of the app
  const { 
    data: teachers = [], 
    isLoading: loadingTeachers 
  } = useTeachers();

  const { 
    data: services = [], 
    isLoading: loadingServices 
  } = useServicesByType('Class'); // Explicitly fetch Class services

  const loading = loadingTeachers || loadingServices;

  // Form state
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

  const createTeacher = async (e) => {
    if (e) e.preventDefault();
    setError(null);

    try {
      const result = await authService.createTeacherAccount(
        newTeacher.email, 
        newTeacher
      );

      setNewTeacher({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        specializations: []
      });

      // 2. INVALIDATE CACHE
      // This forces the "useTeachers" hook to refresh automatically
      await invalidateRelatedCaches('teacher');

      return { success: true, user: result };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const updateTeacher = async (teacherId, updates) => {
    try {
      await userService.updateUser(teacherId, updates);
      await invalidateRelatedCaches('teacher', teacherId);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
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
    updateTeacher,
  };
};

export default useManageTeachers;