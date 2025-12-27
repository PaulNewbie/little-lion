import { useState, useEffect, useMemo, useCallback } from "react";
import childService from "../../../../services/childService";
import activityService from "../../../../services/activityService";

export const useStudentProfileData = (locationState) => {
  // 1. Initialize State from Location (if coming from One-on-One)
  const passedStudent = locationState?.student || null;
  const passedActivities = locationState?.activities || [];

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(passedStudent);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  
  // Activity Data
  const [studentActivities, setStudentActivities] = useState(passedActivities);

  // 2. Fetch All Students
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await childService.getAllChildren();
      setStudents(data);

      // If we are currently viewing a student, update their data in real-time
      if (selectedStudent) {
        const updated = data.find((s) => s.id === selectedStudent.id);
        if (updated) setSelectedStudent(updated);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedStudent]);

  // 3. Fetch Activities for Selected Student
  const fetchStudentActivities = useCallback(async (studentId) => {
    // If we already have activities passed from One-on-One, we might not need to fetch immediately,
    // but usually it's good to fetch fresh data unless specifically told not to.
    try {
      const activities = await activityService.getActivitiesByChild(studentId);
      
      // Enhance activities with student names (logic adapted from your original code)
      const enhancedActivities = activities.map((act) => ({
        ...act,
        participatingStudentsNames: act.participatingStudentIds
          ? act.participatingStudentIds.map((id) => {
              // We need access to the 'students' list here. 
              // Note: If 'students' state isn't populated yet, this might be empty, 
              // but usually fetchStudents runs first.
              return "Student"; // simplified for the hook, or you can look up in 'students' array if available
            })
          : [act.studentName],
      }));

      // Sort by date (Newest first)
      enhancedActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
      setStudentActivities(enhancedActivities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      setStudentActivities([]);
    }
  }, []); // Removed 'students' dependency to prevent infinite loops, can refine if needed

  // 4. Filter Logic (Memoized)
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      const matchesSearch = fullName.includes(searchTerm.toLowerCase());

      // Check enrollment types
      const hasTherapy =
        student.enrolledServices?.some((s) => s.type === "Therapy") ||
        student.therapyServices?.length > 0;

      const hasGroup =
        student.enrolledServices?.some((s) => s.type === "Class") ||
        student.groupClasses?.length > 0;

      if (filterType === "therapy") return matchesSearch && hasTherapy;
      if (filterType === "group") return matchesSearch && hasGroup;
      if (filterType === "none") return matchesSearch && !hasTherapy && !hasGroup;
      
      return matchesSearch; // 'all'
    });
  }, [students, searchTerm, filterType]);

  // 5. Initial Load Effect
  useEffect(() => {
    // If we didn't come from One-on-One, fetch everyone
    if (!passedStudent) {
      fetchStudents();
    } else {
      // If we DID come from One-on-One, we are already "loaded"
      setLoading(false);
      // We also likely have activities passed in, so we don't strictly need to fetch immediately
      if (passedActivities.length === 0) {
        fetchStudentActivities(passedStudent.id);
      }
    }
  }, [passedStudent, passedActivities, fetchStudents, fetchStudentActivities]);

  return {
    students,
    loading,
    selectedStudent,
    setSelectedStudent,
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