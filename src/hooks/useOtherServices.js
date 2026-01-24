import { useState, useEffect } from 'react';
import servicesService from '../services/servicesService';
import userService from '../services/userService'; // Changed from teacher/therapist services
import childService from '../services/childService';
import { useToast } from '../context/ToastContext';

const useOtherServices = () => {
  const toast = useToast();
  const [services, setServices] = useState([]);
  const [teachers, setTeachers] = useState([]); // This variable name is kept for compatibility, but now includes Therapists too
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for Details View
  const [selectedService, setSelectedService] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  
  // Form State for Adding Service
  const [newService, setNewService] = useState({
    name: '', description: '', type: 'Therapy', color: '#000000', active: true
  });

  // Form State for Enrolling Student
  const [enrollmentData, setEnrollmentData] = useState({
    studentId: '',
    teacherId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. Fetch Services and All Staff (Teachers + Therapists) in parallel
      const [sData, staffData] = await Promise.all([
        servicesService.getServicesWithStats(),
        userService.getAllStaff() 
      ]);
      
      setServices(sData);
      
      // 2. Normalize ID fields if necessary (ensure they have an 'id' property for the UI)
      const normalizedStaff = staffData.map(s => ({
        ...s,
        id: s.id || s.uid // Handle case where userService returns 'uid'
      }));
      setTeachers(normalizedStaff);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewService(prev => ({ ...prev, [name]: value }));
  };

  const createService = async (e) => {
    e.preventDefault();
    try {
      await servicesService.createService(newService);
      setNewService({ name: '', description: '', type: 'Therapy', color: '#000000', active: true });
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  // --- SELECTION & ENROLLMENT LOGIC ---

  const selectService = async (service) => {
    setSelectedService(service);
    try {
      setLoading(true);
      const [studentsInService, allChildren] = await Promise.all([
        childService.getChildrenByService(service.name),
        childService.getAllChildren()
      ]);
      setEnrolledStudents(studentsInService);
      setAllStudents(allChildren);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearSelection = () => {
    setSelectedService(null);
    setEnrolledStudents([]);
    setEnrollmentData({ studentId: '', teacherId: '' });
  };

  const handleEnrollmentChange = (e) => {
    setEnrollmentData({ ...enrollmentData, [e.target.name]: e.target.value });
  };

  const enrollStudent = async (e) => {
    e.preventDefault();
    if (!enrollmentData.studentId || !enrollmentData.teacherId) return;

    try {
      const teacher = teachers.find(t => t.id === enrollmentData.teacherId);
      
      const serviceData = {
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        teacherId: teacher.id,
        teacherName: `${teacher.firstName} ${teacher.lastName}`
      };

      await childService.addServiceToChild(enrollmentData.studentId, serviceData);
      
      // Refresh list
      const updatedList = await childService.getChildrenByService(selectedService.name);
      setEnrolledStudents(updatedList);
      setEnrollmentData({ studentId: '', teacherId: '' }); // Reset form
      toast.success('Student enrolled successfully');
    } catch (err) {
      setError(err.message);
    }
  };

  // --- UPDATED: Uses userService instead of teacherService ---
  const toggleTeacherAssignment = async (teacherId, serviceName) => {
    try {
      const teacher = teachers.find(t => t.id === teacherId);
      const currentSpecs = teacher.specializations || [];
      
      let newSpecs = currentSpecs.includes(serviceName)
        ? currentSpecs.filter(s => s !== serviceName)
        : [...currentSpecs, serviceName];
      
      // REPLACEMENT: Use generic updateUser
      await userService.updateUser(teacherId, { specializations: newSpecs });
      
      fetchData(); 
    } catch (err) {
      setError(err.message);
    }
  };

  const deactivateService = async (id) => {
    if (!window.confirm('Deactivate service?')) return;
    try {
      await servicesService.deactivateService(id);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  return {
    services, teachers, loading, error,
    newService, handleInputChange, createService,
    toggleTeacherAssignment, deactivateService,
    selectedService, selectService, clearSelection,
    enrolledStudents, allStudents,
    enrollmentData, handleEnrollmentChange, enrollStudent
  };
};

export default useOtherServices;