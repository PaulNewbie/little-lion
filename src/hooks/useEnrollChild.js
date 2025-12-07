import { useState, useEffect } from 'react';
import servicesService from '../services/servicesService';
import teacherService from '../services/teacherService';
import authService from '../services/authService';
import childService from '../services/childService';
import cloudinaryService from '../services/cloudinaryService'; // Import the new service

const useEnrollChild = () => {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false); // New state for upload status
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
  
  // New state for the photo file
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

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

  // New handler for file selection
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file)); // Create a local preview URL
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
      // 1. Upload Photo to Cloudinary with SPECIFIC FOLDER
      let photoUrl = '';
      if (photoFile) {
        // CHANGED: Added specific folder for profiles
        photoUrl = await cloudinaryService.uploadImage(photoFile, 'little-lions/child-images');
      }

      // ... rest of the auth and firestore logic (createParentAccount, enrollChild) ...
      
      const parentUser = await authService.createParentAccount(parentInfo.email, parentInfo.password, parentInfo);
      
      await childService.enrollChild({
        ...childInfo,
        photoUrl: photoUrl, 
        services: selectedServices,
        teacherIds: [...new Set(selectedServices.map(s => s.teacherId))]
      }, parentUser.uid);

      alert('Enrollment Complete!');
    } catch (err) {
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
    selectedServices, toggleService, updateServiceTeacher,
    photoFile, photoPreview, handlePhotoChange, // Export new photo handlers
    getQualifiedTeachers, handleSubmit
  };
};

export default useEnrollChild;