import { useState, useEffect } from 'react';
import servicesService from '../services/servicesService';
import authService from '../services/authService';
import childService from '../services/childService';
import cloudinaryService from '../services/cloudinaryService';
import userService from '../services/userService';

const useEnrollChild = () => {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // Data Options
  const [therapyOptions, setTherapyOptions] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [teachers, setTeachers] = useState([]);

  // Form Data
  const [childInfo, setChildInfo] = useState({
    firstName: '', lastName: '', dateOfBirth: '', gender: 'select', medicalInfo: ''
  });
  
  const [parentInfo, setParentInfo] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: 'Welcome123!'
  });
  const [parentExists, setParentExists] = useState(false);

  // Selection State
  const [selectedTherapies, setSelectedTherapies] = useState([]); 
  const [selectedClasses, setSelectedClasses] = useState([]);     

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // 1. Initial Data Fetch
  useEffect(() => {
    const init = async () => {
      try {
        const [allServices, allTeachers, allTherapists] = await Promise.all([
          servicesService.getActiveServices(),
          userService.getUsersByRole('teacher'),
          userService.getUsersByRole('therapist')
        ]);

        setTherapyOptions(allServices.filter(s => s.type === 'Therapy'));
        setClassOptions(allServices.filter(s => s.type === 'Class'));
        setTeachers(allTeachers);
        setTherapists(allTherapists);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // 2. Input Handlers
  const handleChildChange = (e) => setChildInfo({ ...childInfo, [e.target.name]: e.target.value });
  
  const handleParentChange = (e) => {
    setParentInfo({ ...parentInfo, [e.target.name]: e.target.value });
    if (e.target.name === 'email') setParentExists(false); 
  };

  const checkParentEmail = async () => {
    if (!parentInfo.email) return;
    try {
      const existingUser = await userService.getUserByEmail(parentInfo.email);
      if (existingUser) {
        setParentExists(true);
        setParentInfo(prev => ({
          ...prev,
          firstName: existingUser.firstName,
          lastName: existingUser.lastName,
          phone: existingUser.phone || '',
          password: '' 
        }));
      } else {
        setParentExists(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // 3. Selection Handlers (THERAPY)
  const toggleTherapy = (serviceId, serviceName) => {
    if (selectedTherapies.find(s => s.serviceId === serviceId)) {
      setSelectedTherapies(selectedTherapies.filter(s => s.serviceId !== serviceId));
    } else {
      const qualified = therapists.find(t => t.specializations?.includes(serviceName));
      setSelectedTherapies([
        ...selectedTherapies,
        { 
          serviceId, 
          serviceName, 
          // FIX 1: Changed .id to .uid
          therapistId: qualified ? qualified.uid : '',
          therapistName: qualified ? `${qualified.firstName} ${qualified.lastName}` : '' 
        }
      ]);
    }
  };

  const updateTherapyAssignee = (serviceId, therapistId) => {
    // FIX 2: Changed .id to .uid
    const person = therapists.find(t => t.uid === therapistId);
    const therapistName = person ? `${person.firstName} ${person.lastName}` : '';

    setSelectedTherapies(selectedTherapies.map(s => 
      s.serviceId === serviceId ? { ...s, therapistId, therapistName } : s
    ));
  };

  // 4. Selection Handlers (CLASSES)
  const toggleClass = (serviceId, serviceName) => {
    if (selectedClasses.find(s => s.serviceId === serviceId)) {
      setSelectedClasses(selectedClasses.filter(s => s.serviceId !== serviceId));
    } else {
      const qualified = teachers.find(t => t.specializations?.includes(serviceName));
      setSelectedClasses([
        ...selectedClasses,
        { 
          serviceId, 
          serviceName, 
          // FIX 3: Changed .id to .uid
          teacherId: qualified ? qualified.uid : '', 
          teacherName: qualified ? `${qualified.firstName} ${qualified.lastName}` : '' 
        }
      ]);
    }
  };

  const updateClassAssignee = (serviceId, teacherId) => {
    // FIX 4: Changed .id to .uid
    const person = teachers.find(t => t.uid === teacherId);
    const teacherName = person ? `${person.firstName} ${person.lastName}` : '';

    setSelectedClasses(selectedClasses.map(s => 
      s.serviceId === serviceId ? { ...s, teacherId, teacherName } : s
    ));
  };

  // 5. Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    const missingTherapist = selectedTherapies.find(s => !s.therapistId);
    if (missingTherapist) {
      setError(`Please select a therapist for ${missingTherapist.serviceName}`);
      return;
    }

    const missingTeacher = selectedClasses.find(s => !s.teacherId);
    if (missingTeacher) {
      setError(`Please select a teacher for ${missingTeacher.serviceName}`);
      return;
    }

    if (selectedTherapies.length === 0 && selectedClasses.length === 0) {
      if (!window.confirm("No services or classes selected. Continue enrollment?")) return;
    }

    setUploading(true);

    try {
      let photoUrl = '';
      if (photoFile) {
        photoUrl = await cloudinaryService.uploadImage(photoFile, 'little-lions/child-images');
      }

      let parentUid;
      if (parentExists) {
        const existingParent = await userService.getUserByEmail(parentInfo.email);
        parentUid = existingParent.uid;
      } else {
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
        therapyServices: selectedTherapies, 
        groupClasses: selectedClasses       
      }, parentUid);

      alert('Child Enrolled Successfully!');
      // Optional: Navigate to dashboard or clear form
      
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Helpers
  const getQualifiedTherapists = (serviceName) => 
    therapists.filter(t => t.specializations?.includes(serviceName));

  const getQualifiedTeachers = (serviceName) => 
    teachers.filter(t => t.specializations?.includes(serviceName));

  return {
    loading, uploading, error,
    childInfo, handleChildChange,
    parentInfo, handleParentChange, parentExists, checkParentEmail,
    photoFile, photoPreview, handlePhotoChange,
    therapyOptions, classOptions,
    selectedTherapies, selectedClasses,
    toggleTherapy, updateTherapyAssignee,
    toggleClass, updateClassAssignee,
    getQualifiedTherapists, getQualifiedTeachers,
    handleSubmit
  };
};

export default useEnrollChild;