import { useState, useEffect, useMemo, useCallback } from "react";
import childService from "../../../../services/childService";
import activityService from "../../../../services/activityService";

export const useStudentProfileData = (locationState) => {
  // 1. Initialize State
  const passedStudent = locationState?.student || null;
  const passedActivities = locationState?.activities || [];

  // STATE: We initialize 'students' with the passed student so it's not empty on first render
  const [students, setStudents] = useState(passedStudent ? [passedStudent] : []);
  
  // CRITICAL FIX: Track ID instead of the object to prevent infinite loops
  const [selectedStudentId, setSelectedStudentId] = useState(passedStudent?.id || null);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  
  // Activity Data
  const [studentActivities, setStudentActivities] = useState(passedActivities);

  // 2. Derived State: Find the full object from the ID
  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return students.find(s => s.id === selectedStudentId) || passedStudent || null;
  }, [students, selectedStudentId, passedStudent]);

  // 3. Fetch All Students (Now decoupled from selectedStudent)
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await childService.getAllChildren();
      setStudents(data);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 4. Fetch Activities
  const fetchStudentActivities = useCallback(async (studentId) => {
    try {
      const activities = await activityService.getActivitiesByChild(studentId);
      
      const enhancedActivities = activities.map((act) => ({
        ...act,
        participatingStudentsNames: act.participatingStudentIds
          ? act.participatingStudentIds.map(() => "Student") 
          : [act.studentName],
      }));

      enhancedActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
      setStudentActivities(enhancedActivities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      setStudentActivities([]);
    }
  }, []);

  // 5. Filter Logic
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      const matchesSearch = fullName.includes(searchTerm.toLowerCase());

      const hasTherapy =
        student.enrolledServices?.some((s) => s.type === "Therapy") ||
        student.therapyServices?.length > 0;

      const hasGroup =
        student.enrolledServices?.some((s) => s.type === "Class") ||
        student.groupClasses?.length > 0;

      if (filterType === "therapy") return matchesSearch && hasTherapy;
      if (filterType === "group") return matchesSearch && hasGroup;
      if (filterType === "none") return matchesSearch && !hasTherapy && !hasGroup;
      
      return matchesSearch;
    });
  }, [students, searchTerm, filterType]);

  // 6. Initial Load Effect
  useEffect(() => {
    fetchStudents();
    // If we have a passed student (from One-on-One), fetch their activities immediately
    if (passedStudent && passedActivities.length === 0) {
       fetchStudentActivities(passedStudent.id);
    }
  }, [fetchStudents, passedStudent, passedActivities.length, fetchStudentActivities]);

  // Helper wrapper to match the old interface
  const handleSetSelectedStudent = (student) => {
    setSelectedStudentId(student ? student.id : null);
  };

  return {
    students,
    loading,
    selectedStudent, // This is now the derived object
    setSelectedStudent: handleSetSelectedStudent, // Passing the wrapper
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    filteredStudents,
    studentActivities,
    fetchStudentActivities,
    refreshData: fetchStudents
  };
};