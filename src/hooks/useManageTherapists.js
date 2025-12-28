import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query'; // ✅ Imports
import userService from '../services/userService';
import authService from '../services/authService';
import servicesService from '../services/offeringsService';

const useManageTherapists = () => {
  const queryClient = useQueryClient(); // ✅ Query Client
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

  // ... (Keep Password Generator) ...
  const generatePassword = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    let password = '';
    for (let i = 0; i < 3; i++) password += letters.charAt(Math.floor(Math.random() * letters.length));
    for (let i = 0; i < 3; i++) password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    return password;
  };

  const [newTherapist, setNewTherapist] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: generatePassword(),
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

  const createTherapist = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await authService.createTherapistAccount(newTherapist.email, newTherapist.password, newTherapist);
      
      // ✅ Refresh the list
      await queryClient.invalidateQueries({ queryKey: ['therapists'] });

      setNewTherapist({ 
        firstName: '', 
        lastName: '', 
        email: '', 
        phone: '', 
        password: generatePassword(), 
        specializations: [] 
      });
      alert('Therapist created successfully');
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteTherapist = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await userService.deleteUser(id);
      
      // ✅ Refresh the list
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