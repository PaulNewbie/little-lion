import { useState, useEffect } from 'react';
import userService from '../services/userService';
import authService from '../services/authService';
import servicesService from '../services/offeringsService';

const useManageTeachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Generate password with format: 3 letters + 3 numbers
  const generatePassword = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    
    let password = '';
    // Add 3 random letters
    for (let i = 0; i < 3; i++) {
      password += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    // Add 3 random numbers
    for (let i = 0; i < 3; i++) {
      password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    return password;
  };

  // Form State
  const [newTeacher, setNewTeacher] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: generatePassword(),
    specializations: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tData, sData] = await Promise.all([
        userService.getUsersByRole('teacher'),
        // CHANGED: Fetch ONLY 'Class' type services for Teachers
        servicesService.getServicesByType('Class') 
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
      setNewTeacher({ 
        firstName: '', 
        lastName: '', 
        email: '', 
        phone: '', 
        password: generatePassword(), 
        specializations: [] 
      });
      fetchData(); 
      alert('Teacher created successfully');
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteTeacher = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
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