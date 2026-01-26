// src/hooks/useManageAdmins.js
// OPTIMIZED: Uses cached 'useAdmins' to prevent duplicate reads

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAdmins } from './useCachedData'; // Import the cached hook
import authService from '../services/authService';
import userService from '../services/userService';
import { useToast } from '../context/ToastContext';

const useManageAdmins = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [error, setError] = useState(null);
  
  // 1. REPLACE useEffect WITH CACHED HOOK
  // This will check memory first. If admins are there, it costs 0 reads!
  const { 
    data: admins = [], 
    isLoading: loading 
  } = useAdmins();

  const [newAdmin, setNewAdmin] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: 'Welcome123!' // Default password
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAdmin(prev => ({ ...prev, [name]: value }));
  };

  const createAdmin = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await authService.createAdminAccount(newAdmin.email, newAdmin.password, newAdmin);
      
      // 2. INVALIDATE CACHE
      // This forces the list to refresh automatically without a manual fetch
      queryClient.invalidateQueries({ queryKey: ['users', 'admin'] });

      setNewAdmin({ 
        firstName: '', lastName: '', email: '', phone: '', 
        password: 'Welcome123!' 
      });
      
      toast.success('Admin created successfully');
    } catch (err) {
      setError(err.message);
    }
  }; 

  const deleteAdmin = async (id) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;
    try {
      await userService.deleteUser(id);
      
      // 3. INVALIDATE CACHE
      queryClient.invalidateQueries({ queryKey: ['users', 'admin'] });
      
    } catch (err) {
      setError(err.message);
    }
  };

  return {
    admins,
    loading,
    error,
    newAdmin,
    handleInputChange,
    createAdmin,
    deleteAdmin
  };
};

export default useManageAdmins;