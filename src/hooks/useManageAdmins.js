import { useState, useEffect } from 'react';
import userService from '../services/userService';
import authService from '../services/authService';

const useManageAdmins = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [newAdmin, setNewAdmin] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: 'Welcome123!' // Default password
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch users with role 'admin'
      const data = await userService.getUsersByRole('admin');
      setAdmins(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAdmin(prev => ({ ...prev, [name]: value }));
  };

  const createAdmin = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await authService.createAdminAccount(newAdmin.email, newAdmin.password, newAdmin);
      setNewAdmin({ 
        firstName: '', lastName: '', email: '', phone: '', 
        password: 'Welcome123!' 
      });
      fetchData(); 
      alert('Admin created successfully');
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteAdmin = async (id) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;
    try {
      await userService.deleteUser(id);
      fetchData();
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