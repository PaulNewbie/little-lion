import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import childService from "../../../../services/childService";
import activityService from "../../../../services/activityService";
import userService from "../../../../services/userService";
import assessmentService from "../../../../services/assessmentService";
import { QUERY_KEYS, QUERY_OPTIONS } from "../../../../config/queryClient";

/**
 * @param {Object} locationState - React Router location state
 * @param {Object} options - Additional options
 * @param {boolean} options.isParentView - If true, only fetches parent's children (not all students)
 * @param {string} options.parentId - Parent's user ID (required when isParentView is true)
 */
export const useStudentProfileData = (locationState, options = {}) => {
  const queryClient = useQueryClient();
  const { isParentView = false, parentId = null } = options;

  const passedStudent = locationState?.student || null;
  const passedActivities = locationState?.activities || [];

  const [selectedStudentId, setSelectedStudentId] = useState(
    passedStudent?.id || null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  // ================= STUDENTS =================
  // OPTIMIZED: Parents only fetch their own children, admins fetch all
  const { data: students = [], isLoading } = useQuery({
    queryKey: isParentView
      ? QUERY_KEYS.studentsByParent(parentId)  // Parent-specific cache key
      : ["students"],                           // Admin cache key
    queryFn: () => {
      if (isParentView && parentId) {
        console.log("📋 Parent View: Fetching only parent's children");
        return childService.getChildrenByParentId(parentId);
      }
      console.log("📋 Admin View: Fetching all students");
      return childService.getAllChildren();
    },
    initialData: passedStudent ? [passedStudent] : undefined,
    ...(isParentView ? QUERY_OPTIONS.semiStatic : {}), // Cache parent data longer
  });

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
  });

  // ================= PARENT =================
  const { data: parentData = null } = useQuery({
    queryKey: ["parent", selectedStudent?.parentId],
    queryFn: () => userService.getUserById(selectedStudent.parentId),
    enabled: !!selectedStudent?.parentId,
  });

  // ================= ASSESSMENT (from assessments collection) =================
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
    // Invalidate the correct cache based on view type
    if (isParentView && parentId) {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.studentsByParent(parentId) });
    } else {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    }
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
