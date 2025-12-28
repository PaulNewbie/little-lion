import { useState } from 'react';
// 1. Import Query hooks
import { useQuery, useQueryClient } from '@tanstack/react-query';
import userService from '../services/userService';
import authService from '../services/authService';
import servicesService from '../services/offeringsService';

const useManageTeachers = () => {
  // 2. Initialize the Client (to control the cache)
  const queryClient = useQueryClient();

  const [error, setError] = useState(null);

  // --- QUERY 1: Fetch Teachers (Cached) ---
  const { 
    data: teachers = [], 
    isLoading: loadingTeachers 
  } = useQuery({
    queryKey: ['teachers'], // Unique Key
    queryFn: () => userService.getUsersByRole('teacher'),
    staleTime: 1000 * 60 * 5, // 5 minutes fresh
  });

  // --- QUERY 2: Fetch Class Services (Cached) ---
  const { 
    data: services = [], 
    isLoading: loadingServices 
  } = useQuery({
    queryKey: ['services', 'Class'], // Specific key for Class services
    queryFn: () => servicesService.getServicesByType('Class'),
    staleTime: 1000 * 60 * 5,
  });

  const loading = loadingTeachers || loadingServices;

  // ... (Keep Password Generator Logic) ...
  const generatePassword = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    let password = '';
    for (let i = 0; i < 3; i++) password += letters.charAt(Math.floor(Math.random() * letters.length));
    for (let i = 0; i < 3; i++) password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    return password;
  };

  const [newTeacher, setNewTeacher] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: generatePassword(),
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

  // --- ACTIONS (Create / Delete) ---
  
  const createTeacher = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await authService.createTeacherAccount(newTeacher.email, newTeacher.password, newTeacher);
      
      // ✅ MAGIC: Tell React Query to re-fetch 'teachers' instantly
      await queryClient.invalidateQueries({ queryKey: ['teachers'] });

      setNewTeacher({ 
        firstName: '', 
        lastName: '', 
        email: '', 
        phone: '', 
        password: generatePassword(), 
        specializations: [] 
      });
      alert('Teacher created successfully');
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteTeacher = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await userService.deleteUser(id);
      
      // ✅ MAGIC: Auto-refresh list after delete
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