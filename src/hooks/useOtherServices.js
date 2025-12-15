import { useState, useEffect } from 'react';
import servicesService from '../services/servicesService';
import teacherService from '../services/teacherService';
import childService from '../services/childService';
import therapistService from '../services/therapistService';

const useOtherServices = () => {
  const [services, setServices] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New State for Details View
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
      // Fetch both groups
      const [sData, tData, thData] = await Promise.all([
        servicesService.getServicesWithStats(),
        teacherService.getAllTeachers(),
        therapistService.getAllTherapists()
      ]);
      setServices(sData);
      setTeachers([...tData, ...thData]); // Combine them
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

  // --- NEW LOGIC ---

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
      alert('Student enrolled successfully');
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleTeacherAssignment = async (teacherId, serviceName) => {
    /* ... (Keep existing logic) ... */
    try {
      const teacher = teachers.find(t => t.id === teacherId);
      const currentSpecs = teacher.specializations || [];
      let newSpecs = currentSpecs.includes(serviceName)
        ? currentSpecs.filter(s => s !== serviceName)
        : [...currentSpecs, serviceName];
      await teacherService.updateSpecializations(teacherId, newSpecs);
      fetchData(); 
    } catch (err) {
      setError(err.message);
    }
  };

  const deactivateService = async (id) => {
    /* ... (Keep existing logic) ... */
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
    // New exports
    selectedService, selectService, clearSelection,
    enrolledStudents, allStudents,
    enrollmentData, handleEnrollmentChange, enrollStudent
  };
};

export default useOtherServices;