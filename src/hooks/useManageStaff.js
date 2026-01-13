// src/hooks/useManageStaff.js
// Factory hook for managing staff (teachers, therapists)

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import userService from '../services/userService';
import authService from '../services/authService';
import servicesService from '../services/offeringsService';

/**
 * Factory function to create staff management hooks
 * @param {Object} config - Configuration object
 * @param {string} config.role - Role name ('teacher' or 'therapist')
 * @param {string} config.serviceType - Service type ('Class' or 'Therapy')
 * @param {Function} config.createAccountFn - Auth service function to create account
 * @param {Object} config.initialFormState - Initial state for the form
 */
const createStaffHook = (config) => {
  const {
    role,
    serviceType,
    createAccountFn,
    initialFormState
  } = config;

  const queryKey = `${role}s`; // 'teachers' or 'therapists'

  return () => {
    const queryClient = useQueryClient();
    const [error, setError] = useState(null);

    // Fetch staff list
    const {
      data: staff = [],
      isLoading: loadingStaff
    } = useQuery({
      queryKey: [queryKey],
      queryFn: () => userService.getUsersByRole(role),
      staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Fetch services
    const {
      data: services = [],
      isLoading: loadingServices
    } = useQuery({
      queryKey: ['services', serviceType],
      queryFn: () => servicesService.getServicesByType(serviceType),
      staleTime: 1000 * 60 * 5,
    });

    const loading = loadingStaff || loadingServices;

    // Form state
    const [formData, setFormData] = useState(initialFormState);

    const handleInputChange = useCallback((e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const toggleSpecialization = useCallback((serviceName) => {
      setFormData(prev => {
        const specs = prev.specializations.includes(serviceName)
          ? prev.specializations.filter(s => s !== serviceName)
          : [...prev.specializations, serviceName];
        return { ...prev, specializations: specs };
      });
    }, []);

    const resetForm = useCallback(() => {
      setFormData(initialFormState);
    }, []);

    /**
     * Create a new staff account
     * Returns the created user data INCLUDING activationCode for the modal
     */
    const createStaff = async (e) => {
      e.preventDefault();
      setError(null);

      try {
        // Build user data from form, excluding email
        const { email, ...userData } = formData;

        const result = await createAccountFn(email, userData);

        // Refresh the list
        await queryClient.invalidateQueries({ queryKey: [queryKey] });

        // Reset form
        resetForm();

        // Return the result so the component can show the activation modal
        return {
          success: true,
          user: {
            uid: result.uid,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            activationCode: result.activationCode
          }
        };
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      }
    };

    const deleteStaff = async (id) => {
      if (!window.confirm(`Are you sure you want to delete this ${role}?`)) return;
      try {
        await userService.deleteUser(id);
        await queryClient.invalidateQueries({ queryKey: [queryKey] });
      } catch (err) {
        setError(err.message);
      }
    };

    return {
      staff,
      services,
      loading,
      error,
      formData,
      handleInputChange,
      toggleSpecialization,
      createStaff,
      deleteStaff,
      resetForm
    };
  };
};

// Teacher configuration
const teacherConfig = {
  role: 'teacher',
  serviceType: 'Class',
  createAccountFn: (email, data) => authService.createTeacherAccount(email, data),
  initialFormState: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specializations: []
  }
};

// Therapist configuration
const therapistConfig = {
  role: 'therapist',
  serviceType: 'Therapy',
  createAccountFn: (email, data) => authService.createTherapistAccount(email, data),
  initialFormState: {
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    phone: '',
    specializations: []
  }
};

// Export the factory-generated hooks
export const useManageTeachersNew = createStaffHook(teacherConfig);
export const useManageTherapistsNew = createStaffHook(therapistConfig);

// Export the factory for custom configurations
export default createStaffHook;
