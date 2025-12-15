import { useState, useEffect } from 'react';
import userService from '../services/userService';
import authService from '../services/authService';
import servicesService from '../services/servicesService';

const useManageTeachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form State
  const [newTeacher, setNewTeacher] = useState({
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
        // FIXED: Changed getAllTeachers() to getUsersByRole('teacher')
        userService.getUsersByRole('teacher'),
        servicesService.getActiveServices()
      ]);
      setTeachers(tData);
      setServices(sData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
    e.preventDefault();
    setError(null);
    try {
      await authService.createTeacherAccount(newTeacher.email, newTeacher.password, newTeacher);
      // Reset form
      setNewTeacher({ 
        firstName: '', lastName: '', email: '', phone: '', 
        password: 'Welcome123!', specializations: [] 
      });
      fetchData(); // Refresh list
      alert('Teacher created successfully');
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteTeacher = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      // FIXED: Changed deleteTeacher(id) to deleteUser(id)
      await userService.deleteUser(id);
      fetchData();
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