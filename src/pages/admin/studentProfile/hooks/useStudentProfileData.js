import { useState, useEffect, useMemo, useCallback } from "react";
import childService from "../../../../services/childService";
import activityService from "../../../../services/activityService";
import userService from "../../../../services/userService"; // Import userService

export const useStudentProfileData = (locationState) => {
  // 1. Initialize State
  const passedStudent = locationState?.student || null;
  const passedActivities = locationState?.activities || [];

  const [students, setStudents] = useState(passedStudent ? [passedStudent] : []);
  const [selectedStudentId, setSelectedStudentId] = useState(passedStudent?.id || null);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  
  // Activity Data
  const [studentActivities, setStudentActivities] = useState(passedActivities);
  
  // NEW: Parent Data State
  const [parentData, setParentData] = useState(null);

  // 2. Derived State: Find the full object from the ID
  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return students.find(s => s.id === selectedStudentId) || passedStudent || null;
  }, [students, selectedStudentId, passedStudent]);

  // 3. Fetch All Students
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

  // NEW: Fetch Parent Data when selectedStudent changes
  useEffect(() => {
    const fetchParent = async () => {
      if (selectedStudent?.parentId) {
        try {
          const parent = await userService.getUserById(selectedStudent.parentId);
          setParentData(parent);
        } catch (error) {
          console.error("Error fetching parent data:", error);
          setParentData(null);
        }
      } else {
        setParentData(null);
      }
    };
    fetchParent();
  }, [selectedStudent]);

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
    if (passedStudent && passedActivities.length === 0) {
       fetchStudentActivities(passedStudent.id);
    }
  }, [fetchStudents, passedStudent, passedActivities.length, fetchStudentActivities]);

  const handleSetSelectedStudent = (student) => {
    setSelectedStudentId(student ? student.id : null);
  };

  return {
    students,
    loading,
    selectedStudent,
    setSelectedStudent: handleSetSelectedStudent,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    filteredStudents,
    studentActivities,
    fetchStudentActivities,
    refreshData: fetchStudents,
    parentData // Export this so the UI can use it
  };
};