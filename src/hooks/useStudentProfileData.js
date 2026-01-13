import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useStudents, useLoadMoreStudents } from "../../../../hooks/useRoleBasedData"; 
import activityService from "../../../../services/activityService";
import userService from "../../../../services/userService";
import assessmentService from "../../../../services/assessmentService";

export const useStudentProfileData = (locationState) => {
  const queryClient = useQueryClient();

  // === CONFIG ===
  const PAGE_SIZE = 8; // Fetch exactly 8 students per page

  const passedStudent = locationState?.student || null;
  const passedActivities = locationState?.activities || [];

  const [selectedStudentId, setSelectedStudentId] = useState(
    passedStudent?.id || null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  // ================= STUDENTS (Optimized) =================
  const { 
    data: studentsData, 
    isLoading 
  } = useStudents({ pageSize: PAGE_SIZE }); 

  // Handle the different return structures (Admin gets object with pagination, Parent gets array)
  const students = useMemo(() => {
    if (Array.isArray(studentsData)) return studentsData;
    return studentsData?.students || [];
  }, [studentsData]);

  const hasMore = !Array.isArray(studentsData) && studentsData?.hasMore;
  const lastDoc = !Array.isArray(studentsData) ? studentsData?.lastDoc : null;
  
  // Hook to load next page
  const { loadMore } = useLoadMoreStudents();

  // ================= AUTO SELECT FROM NAV =================
  useEffect(() => {
    if (locationState?.studentId) {
      setSelectedStudentId(locationState.studentId);
    }
  }, [locationState?.studentId]);

  // ================= SELECTED STUDENT =================
  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return students.find((s) => s.id === selectedStudentId) || passedStudent;
  }, [students, selectedStudentId, passedStudent]);

  // ================= ACTIVITIES =================
  const { data: studentActivities = [] } = useQuery({
    queryKey: ["activities", selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return [];
      const acts = await activityService.getActivitiesByChild(
        selectedStudentId
      );
      return acts.sort((a, b) => new Date(b.date) - new Date(a.date));
    },
    enabled: !!selectedStudentId,
    initialData: passedActivities.length ? passedActivities : undefined,
  });

  // ================= PARENT =================
  const { data: parentData = null } = useQuery({
    queryKey: ["parent", selectedStudent?.parentId],
    queryFn: () => userService.getUserById(selectedStudent.parentId),
    enabled: !!selectedStudent?.parentId,
  });

  // ================= ASSESSMENT =================
  const {
    data: assessmentData = null,
    isLoading: isAssessmentLoading,
    error: assessmentError,
  } = useQuery({
    queryKey: ["assessment", selectedStudent?.assessmentId],
    queryFn: async () => {
      if (!selectedStudent?.assessmentId) return null;
      return await assessmentService.getAssessment(
        selectedStudent.assessmentId
      );
    },
    enabled: !!selectedStudent?.assessmentId,
  });

  // ================= FILTER =================
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const name = `${s.firstName} ${s.lastName}`.toLowerCase();
      if (!name.includes(searchTerm.toLowerCase())) return false;

      const hasTherapy =
        s.enrolledServices?.some((x) => x.type === "Therapy") ||
        s.therapyServices?.length > 0;

      const hasGroup =
        s.enrolledServices?.some((x) => x.type === "Class") ||
        s.groupClasses?.length > 0;

      if (filterType === "therapy") return hasTherapy;
      if (filterType === "group") return hasGroup;
      if (filterType === "none") return !hasTherapy && !hasGroup;
      return true;
    });
  }, [students, searchTerm, filterType]);

  // ================= HELPERS =================
  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["students"] });
    if (selectedStudent?.assessmentId) {
      queryClient.invalidateQueries({
        queryKey: ["assessment", selectedStudent.assessmentId],
      });
    }
  };

  const handleLoadMore = () => {
    if (lastDoc) loadMore(lastDoc, PAGE_SIZE); // Pass PAGE_SIZE here
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
    studentActivities,
    parentData,
    assessmentData,
    isAssessmentLoading,
    assessmentError,
    refreshData,
    // Pagination exports
    hasMore,
    handleLoadMore
  };
};