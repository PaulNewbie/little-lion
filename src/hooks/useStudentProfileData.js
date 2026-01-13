import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import childService from "../../../../services/childService";
import activityService from "../../../../services/activityService";
import userService from "../../../../services/userService";
import assessmentService from "../../../../services/assessmentService";

export const useStudentProfileData = (locationState) => {
  const queryClient = useQueryClient();

  const passedStudent = locationState?.student || null;
  const passedActivities = locationState?.activities || [];

  const [selectedStudentId, setSelectedStudentId] = useState(
    passedStudent?.id || null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  // ================= STUDENTS =================
  // FIX 1 & 2: Use paginated fetch to avoid "getAllChildren" deprecation
  // and add staleTime to prevent infinite render loops.
  const { data: studentsData, isLoading } = useQuery({
    queryKey: ["students", "list"], // Changed key to avoid conflict
    queryFn: () => childService.getChildrenPaginated({ limit: 50 }), // Fetch first 50 instead of all
    staleTime: 5 * 60 * 1000, // FIX: Keep data fresh for 5 mins to prevent loop
    initialData: passedStudent ? { students: [passedStudent] } : undefined,
  });

  // Handle the different structure (paginated returns { students: [...] })
  const students = studentsData?.students || (Array.isArray(studentsData) ? studentsData : []);

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
      const acts = await activityService.getActivitiesByChild(
        selectedStudentId
      );
      return acts.sort((a, b) => new Date(b.date) - new Date(a.date));
    },
    enabled: !!selectedStudentId,
    initialData: passedActivities.length ? passedActivities : undefined,
    staleTime: 60 * 1000, // Add staleTime here too
  });

  // ================= PARENT =================
  const { data: parentData = null } = useQuery({
    queryKey: ["parent", selectedStudent?.parentId],
    queryFn: () => userService.getUserById(selectedStudent.parentId),
    enabled: !!selectedStudent?.parentId,
    staleTime: 60 * 60 * 1000,
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
    staleTime: 30 * 60 * 1000,
  });

  // ================= FILTER =================
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const name = `${s.firstName} ${s.lastName}`.toLowerCase();
      if (!name.includes(searchTerm.toLowerCase())) return false;

      // Update checks to look in correct arrays
      const hasTherapy =
        s.oneOnOneServices?.length > 0 ||
        s.enrolledServices?.some((x) => x.type === "Therapy") ||
        s.therapyServices?.length > 0;

      const hasGroup =
        s.groupClassServices?.length > 0 ||
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
  };
};