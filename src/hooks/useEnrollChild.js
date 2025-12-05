import { useState, useEffect } from 'react';
import servicesService from '../services/servicesService';
import teacherService from '../services/teacherService';
import authService from '../services/authService';
import childService from '../services/childService';

const useEnrollChild = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [services, setServices] = useState([]);
  const [teachers, setTeachers] = useState([]);

  // Form Data
  const [childInfo, setChildInfo] = useState({
    firstName: '', lastName: '', dateOfBirth: '', gender: 'select', medicalInfo: ''
  });
  const [parentInfo, setParentInfo] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: 'Welcome123!'
  });
  const [selectedServices, setSelectedServices] = useState([]);

  useEffect(() => {
    const init = async () => {
      try {
        const [sData, tData] = await Promise.all([
          servicesService.getActiveServices(),
          teacherService.getAllTeachers()
        ]);
        setServices(sData);
        setTeachers(tData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleChildChange = (e) => setChildInfo({ ...childInfo, [e.target.name]: e.target.value });
  const handleParentChange = (e) => setParentInfo({ ...parentInfo, [e.target.name]: e.target.value });

  const toggleService = (serviceId, serviceName) => {
    if (selectedServices.find(s => s.serviceId === serviceId)) {
      setSelectedServices(selectedServices.filter(s => s.serviceId !== serviceId));
    } else {
      // Auto-assign first available teacher for simplicity, or leave empty
      const qualified = teachers.find(t => t.specializations?.includes(serviceName));
      setSelectedServices([
        ...selectedServices,
        { serviceId, serviceName, teacherId: qualified ? qualified.id : '', teacherName: qualified ? qualified.firstName : '' }
      ]);
    }
  };

  const updateServiceTeacher = (serviceId, teacherId) => {
    const teacher = teachers.find(t => t.id === teacherId);
    setSelectedServices(selectedServices.map(s => 
      s.serviceId === serviceId ? { ...s, teacherId, teacherName: teacher.firstName } : s
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      // 1. Create Parent Auth
      const parentUser = await authService.createParentAccount(parentInfo.email, parentInfo.password, parentInfo);
      
      // 2. Create Child Doc
      await childService.enrollChild({
        ...childInfo,
        services: selectedServices,
        teacherIds: [...new Set(selectedServices.map(s => s.teacherId))]
      }, parentUser.uid);

      alert('Enrollment Complete!');
      // Reset logic could go here
    } catch (err) {
      setError(err.message);
    }
  };

  // Helper for UI
  const getQualifiedTeachers = (serviceName) => 
    teachers.filter(t => t.specializations?.includes(serviceName));

  return {
    loading, error, services, 
    childInfo, handleChildChange,
    parentInfo, handleParentChange,
    selectedServices, toggleService, updateServiceTeacher,
    getQualifiedTeachers, handleSubmit
  };
};

export default useEnrollChild;