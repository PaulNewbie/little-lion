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

  // Selection State (Separated)
  const [selectedTherapies, setSelectedTherapies] = useState([]); // [{ serviceId, name, therapistId, therapistName }]
  const [selectedClasses, setSelectedClasses] = useState([]);     // [{ serviceId, name, teacherId, teacherName }]

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // 1. Initial Data Fetch
  useEffect(() => {
    const init = async () => {
      try {
        const [allServices, allTeachers, allTherapists] = await Promise.all([
          servicesService.getActiveServices(),
          userService.getAllTeachers(),
          userService.getAllTherapists()
        ]);

        // Separate Services by Type
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
      // Find therapists who specialize in this service
      const qualified = therapists.find(t => t.specializations?.includes(serviceName));
      setSelectedTherapies([
        ...selectedTherapies,
        { 
          serviceId, 
          serviceName, 
          therapistId: qualified ? qualified.id : '', // Default to first match or empty
          therapistName: qualified ? `${qualified.firstName} ${qualified.lastName}` : '' 
        }
      ]);
    }
  };

  const updateTherapyAssignee = (serviceId, therapistId) => {
    const person = therapists.find(t => t.id === therapistId);
    setSelectedTherapies(selectedTherapies.map(s => 
      s.serviceId === serviceId ? { ...s, therapistId, therapistName: `${person.firstName} ${person.lastName}` } : s
    ));
  };

  // 4. Selection Handlers (CLASSES)
  const toggleClass = (serviceId, serviceName) => {
    if (selectedClasses.find(s => s.serviceId === serviceId)) {
      setSelectedClasses(selectedClasses.filter(s => s.serviceId !== serviceId));
    } else {
      // Find teachers who teach this class
      // Note: 'classesTeaching' isn't in your user model yet, using 'specializations' for now based on your old code
      // or we just filter all teachers. Let's assume teachers use 'specializations' for classes too as per current TeacherService
      const qualified = teachers.find(t => t.specializations?.includes(serviceName));
      setSelectedClasses([
        ...selectedClasses,
        { 
          serviceId, 
          serviceName, 
          teacherId: qualified ? qualified.id : '', 
          teacherName: qualified ? `${qualified.firstName} ${qualified.lastName}` : '' 
        }
      ]);
    }
  };

  const updateClassAssignee = (serviceId, teacherId) => {
    const person = teachers.find(t => t.id === teacherId);
    setSelectedClasses(selectedClasses.map(s => 
      s.serviceId === serviceId ? { ...s, teacherId, teacherName: `${person.firstName} ${person.lastName}` } : s
    ));
  };

  // 5. Submit
const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // --- NEW VALIDATION START ---
    // 1. Check if any therapies are selected but have no therapist assigned
    const missingTherapist = selectedTherapies.find(s => !s.therapistId);
    if (missingTherapist) {
      setError(`Please select a therapist for ${missingTherapist.serviceName}`);
      return;
    }

    // 2. Check if any classes are selected but have no teacher assigned
    const missingTeacher = selectedClasses.find(s => !s.teacherId);
    if (missingTeacher) {
      setError(`Please select a teacher for ${missingTeacher.serviceName}`);
      return;
    }

    // 3. Ensure at least one service is selected (Optional, but good practice)
    if (selectedTherapies.length === 0 && selectedClasses.length === 0) {
      if (!window.confirm("No services or classes selected. Continue enrollment?")) return;
    }
    // --- NEW VALIDATION END ---

    setUploading(true);

    try {
      let photoUrl = '';
      if (photoFile) {
        photoUrl = await cloudinaryService.uploadImage(photoFile, 'little-lions/child-images');
      }

      // Handle Parent Account
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
      
      // Save Child Data
      await childService.enrollChild({
        ...childInfo,
        photoUrl: photoUrl,
        therapyServices: selectedTherapies, 
        groupClasses: selectedClasses       
      }, parentUid);

      alert('Child Enrolled Successfully!');
      // Optional: Navigate to dashboard or reset form
      
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Helpers for Dropdowns
  const getQualifiedTherapists = (serviceName) => 
    therapists.filter(t => t.specializations?.includes(serviceName));

  const getQualifiedTeachers = (serviceName) => 
    teachers.filter(t => t.specializations?.includes(serviceName));

  return {
    loading, uploading, error,
    childInfo, handleChildChange,
    parentInfo, handleParentChange, parentExists, checkParentEmail,
    photoFile, photoPreview, handlePhotoChange,
    
    // Arrays for UI
    therapyOptions,
    classOptions,
    
    // Selection State
    selectedTherapies,
    selectedClasses,
    
    // Handlers
    toggleTherapy,
    updateTherapyAssignee,
    toggleClass,
    updateClassAssignee,
    
    // Filtering
    getQualifiedTherapists,
    getQualifiedTeachers,
    
    handleSubmit
  };
};

export default useEnrollChild;