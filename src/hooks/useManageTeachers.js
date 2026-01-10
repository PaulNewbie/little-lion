// src/hooks/useManageTeachers.js
// UPDATED: Uses optimized queries and caching

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useStaff, useServices } from './useRoleBasedData';
import { QUERY_KEYS, invalidateRelatedCaches } from '../config/queryClient';
import authService from '../services/authService';
import userService from '../services/userService';

const useManageTeachers = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState(null);

  // Using optimized hooks instead of direct queries
  const { 
    data: teachers = [], 
    isLoading: loadingTeachers 
  } = useStaff({ role: 'teacher' });

  const { 
    data: services = [], 
    isLoading: loadingServices 
  } = useServices({ type: 'Class' });

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

      // Reset form
      setNewTeacher({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        specializations: []
      });

      // Invalidate caches using optimized helper
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
