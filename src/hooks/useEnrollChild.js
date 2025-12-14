/* src/hooks/useEnrollChild.js */
import { useState, useEffect } from 'react';
import servicesService from '../services/servicesService';
import teacherService from '../services/teacherService';
import authService from '../services/authService';
import childService from '../services/childService';
import cloudinaryService from '../services/cloudinaryService';
import userService from '../services/userService';
import therapistService from '../services/therapistService';

const useEnrollChild = () => {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [services, setServices] = useState([]);
  const [teachers, setTeachers] = useState([]);

  // Form Data
  const [childInfo, setChildInfo] = useState({
    firstName: '', lastName: '', dateOfBirth: '', gender: 'select', medicalInfo: ''
  });
  
  // Parent Data
  const [parentInfo, setParentInfo] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: 'Welcome123!'
  });
  const [parentExists, setParentExists] = useState(false); // NEW STATE

  const [selectedServices, setSelectedServices] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

useEffect(() => {
    const init = async () => {
      try {
        // Fetch Teachers AND Therapists
        const [sData, tData, thData] = await Promise.all([
          servicesService.getActiveServices(),
          teacherService.getAllTeachers(),
          therapistService.getAllTherapists() // Fetch Therapists
        ]);
        setServices(sData);
        // Combine them into one list for the dropdowns
        setTeachers([...tData, ...thData]); 
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleChildChange = (e) => setChildInfo({ ...childInfo, [e.target.name]: e.target.value });
  
  const handleParentChange = (e) => {
    setParentInfo({ ...parentInfo, [e.target.name]: e.target.value });
    // Reset exists flag if they change email, until blur happens
    if (e.target.name === 'email') setParentExists(false); 
  };

  // --- NEW: Check if parent exists when email field loses focus ---
  const checkParentEmail = async () => {
    if (!parentInfo.email) return;
    
    try {
      const existingUser = await userService.getUserByEmail(parentInfo.email);
      if (existingUser) {
        setParentExists(true);
        // Auto-fill details
        setParentInfo(prev => ({
          ...prev,
          firstName: existingUser.firstName,
          lastName: existingUser.lastName,
          phone: existingUser.phone || '',
          password: '' // Clear password as it's not needed
        }));
      } else {
        setParentExists(false);
      }
    } catch (err) {
      console.error("Error checking parent:", err);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const toggleService = (serviceId, serviceName) => {
    if (selectedServices.find(s => s.serviceId === serviceId)) {
      setSelectedServices(selectedServices.filter(s => s.serviceId !== serviceId));
    } else {
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
    setUploading(true);

    try {
      let photoUrl = '';
      if (photoFile) {
        photoUrl = await cloudinaryService.uploadImage(photoFile, 'little-lions/child-images');
      }

      let parentUid;
      const existingParent = await userService.getUserByEmail(parentInfo.email);

      if (existingParent) {
        // CASE A: Existing Parent
        parentUid = existingParent.uid;
      } else {
        // CASE B: New Parent
        const parentUser = await authService.createParentAccount(
          parentInfo.email, 
          parentInfo.password, 
          parentInfo
        );
        parentUid = parentUser.uid;
      }
      
      await childService.enrollChild({
        ...childInfo,
        photoUrl: photoUrl, 
        services: selectedServices,
        teacherIds: [...new Set(selectedServices.map(s => s.teacherId))]
      }, parentUid);

      alert('Enrollment Complete!');
      // Reset could go here
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const getQualifiedTeachers = (serviceName) => 
    teachers.filter(t => t.specializations?.includes(serviceName));

  return {
    loading, uploading, error, services, 
    childInfo, handleChildChange,
    parentInfo, handleParentChange,
    parentExists, checkParentEmail, // EXPORTED NEW HANDLERS
    selectedServices, toggleService, updateServiceTeacher,
    photoFile, photoPreview, handlePhotoChange,
    getQualifiedTeachers, handleSubmit
  };
};

export default useEnrollChild;