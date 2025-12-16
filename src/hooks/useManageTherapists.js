import { useState, useEffect } from 'react';
import userService from '../services/userService';
import authService from '../services/authService';
import servicesService from '../services/servicesService';

const useManageTherapists = () => {
  const [therapists, setTherapists] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [newTherapist, setNewTherapist] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: 'Welcome123!',
    specializations: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tData, sData] = await Promise.all([
        // FIXED: Changed getAllTherapists() to getUsersByRole('therapist')
        userService.getUsersByRole('therapist'),
        servicesService.getActiveServices()
      ]);
      setTherapists(tData);
      setServices(sData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
    e.preventDefault();
    setError(null);
    try {
      await authService.createTherapistAccount(newTherapist.email, newTherapist.password, newTherapist);
      setNewTherapist({ 
        firstName: '', lastName: '', email: '', phone: '', 
        password: 'Welcome123!', specializations: [] 
      });
      fetchData(); 
      alert('Therapist created successfully');
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteTherapist = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      // FIXED: Ensure deleteUser is used if deleteTherapist doesn't exist, 
      // or ensure deleteTherapist maps to deleteUser in userService.
      // Based on your userService, you have deleteUser but not deleteTherapist.
      await userService.deleteUser(id); 
      fetchData();
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