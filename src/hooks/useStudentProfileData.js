// src/pages/admin/studentProfile/hooks/useStudentProfileData.js
// OPTIMIZED: Uses centralized cached hooks to prevent duplicate reads

import { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useChild, useAllChildren, useChildActivities } from "../../../../hooks/useCachedData";
import activityService from "../../../../services/activityService";
import userService from "../../../../services/userService";
import assessmentService from "../../../../services/assessmentService";

export const useStudentProfileData = (locationState) => {
  const queryClient = useQueryClient();

  const passedStudent = locationState?.student || null;
  const passedActivities = locationState?.activities || [];

  const [selectedStudentId, setSelectedStudentId] = useState(
    passedStudent?.id || locationState?.studentId || null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  // ================= 1. FETCH ALL STUDENTS (Cached List) =================
  // Uses useAllChildren which shares the ['students'] key
  const { data: students = [], isLoading } = useAllChildren();

  // ================= 2. FETCH SINGLE STUDENT (Cached Individual) =================
  // This is the MAGIC FIX. It checks the specific ['student', id] cache.
  // If you came from ManageTherapists, this data is already there! (0 Reads)
  const { data: studentFromCache } = useChild(selectedStudentId);

  // ================= 3. RESOLVE SELECTED STUDENT =================
  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    // Prioritize the cache (fastest), then passed state, then find in list
    return studentFromCache || passedStudent || students.find((s) => s.id === selectedStudentId);
  }, [selectedStudentId, studentFromCache, passedStudent, students]);

  // ================= AUTO SELECT FROM NAV =================
  useEffect(() => {
    if (locationState?.studentId) {
      setSelectedStudentId(locationState.studentId);
    }
  }, [locationState?.studentId]);

  // ================= ACTIVITIES =================
  // Uses centralized cached hook with auto-refresh (dynamic stale time)
  const { data: studentActivities = [] } = useChildActivities(selectedStudentId);

  // ================= PARENT =================
  const { data: parentData = null } = useMemo(() => {
     // You can use useUser(selectedStudent?.parentId) here if you want to cache parents too!
     return { data: null }; // Placeholder to keep structure simple
  }, []);

  // ================= FILTER =================
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const name = `${s.firstName} ${s.lastName}`.toLowerCase();
      if (!name.includes(searchTerm.toLowerCase())) return false;

      const hasTherapy =
        s.enrolledServices?.some((x) => x.type === "Therapy") ||
        s.oneOnOneServices?.length > 0; // Updated to check correct arrays

      const hasGroup =
        s.enrolledServices?.some((x) => x.type === "Class") ||
        s.groupClassServices?.length > 0;

      if (filterType === "therapy") return hasTherapy;
      if (filterType === "group") return hasGroup;
      if (filterType === "none") return !hasTherapy && !hasGroup;
      return true;
    });
  }, [students, searchTerm, filterType]);

  // ================= HELPERS =================
  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["students"] });
    if (selectedStudent?.id) {
       queryClient.invalidateQueries({ queryKey: ["student", selectedStudent.id] });
       queryClient.invalidateQueries({ queryKey: ["activities", selectedStudent.id] });
    }
  };

  return {
    loading: isLoading,
    students,
    selectedStudent,
    setSelectedStudent: (s) => setSelectedStudentId(s ? s.id : null),
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    filteredStudents,
    studentActivities: passedActivities.length ? passedActivities : studentActivities,
    parentData,
    assessmentData: null, // Simplified
    isAssessmentLoading: false,
    assessmentError: null,
    refreshData,
  };
};