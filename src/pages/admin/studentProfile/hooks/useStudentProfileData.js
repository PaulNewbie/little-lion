import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import childService from "../../../../services/childService";
import activityService from "../../../../services/activityService";
import userService from "../../../../services/userService";
import assessmentService from "../../../../services/assessmentService";
import { QUERY_KEYS, QUERY_OPTIONS } from "../../../../config/queryClient";

// =============================================================================
// HELPER: CACHE SEEDING - Same pattern as useCachedData.js
// =============================================================================
const seedStudentCache = (queryClient, students) => {
  if (!students || !Array.isArray(students)) return;

  students.forEach(student => {
    if (student && student.id) {
      queryClient.setQueryData(QUERY_KEYS.student(student.id), student);
    }
  });
  console.log(`🌱 StudentProfile: Seeded ${students.length} students into individual cache`);
};

/**
 * @param {Object} locationState - React Router location state
 * @param {Object} options - Additional options
 * @param {boolean} options.isParentView - If true, only fetches parent's children (not all students)
 * @param {string} options.parentId - Parent's user ID (required when isParentView is true)
 * @param {boolean} options.isStaffView - If true, only fetches staff's assigned students
 * @param {string} options.staffId - Staff's user ID (required when isStaffView is true)
 * @param {boolean} options.singleStudentMode - If true, only uses the passed student (no list fetch)
 */
export const useStudentProfileData = (locationState, options = {}) => {
  const queryClient = useQueryClient();
  const {
    isParentView = false,
    parentId = null,
    isStaffView = false,
    staffId = null,
    singleStudentMode = false
  } = options;

  const passedStudent = locationState?.student || null;
  const passedActivities = locationState?.activities || [];

  const [selectedStudentId, setSelectedStudentId] = useState(
    passedStudent?.id || locationState?.studentId || null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  // ================= DETERMINE QUERY KEY =================
  const getQueryKey = () => {
    if (singleStudentMode && passedStudent) {
      // Use a dedicated key for single student view (different from individual cache)
      return ['studentProfile', 'single', passedStudent.id];
    }
    if (isParentView && parentId) {
      return QUERY_KEYS.studentsByParent(parentId);
    }
    if (isStaffView && staffId) {
      return QUERY_KEYS.studentsByStaff(staffId);
    }
    return QUERY_KEYS.students();
  };

  // ================= STUDENTS =================
  // OPTIMIZED: Use consistent query keys and seed cache after fetching
  const { data: studentsData, isLoading } = useQuery({
    queryKey: getQueryKey(),
    queryFn: async () => {
      // ─────────────────────────────────────────────────────────────────
      // SINGLE STUDENT MODE: Just use the passed student (0 reads)
      // ─────────────────────────────────────────────────────────────────
      if (singleStudentMode && passedStudent) {
        console.log("♻️ Single Student Mode: Using passed student (0 Reads)");
        // Seed individual cache for other hooks to use
        queryClient.setQueryData(QUERY_KEYS.student(passedStudent.id), passedStudent);
        return [passedStudent];
      }

      // ─────────────────────────────────────────────────────────────────
      // STAFF VIEW: Only fetch staff's assigned students
      // ─────────────────────────────────────────────────────────────────
      if (isStaffView && staffId) {
        // Check if we already have staff's students cached
        const cachedStaffStudents = queryClient.getQueryData(QUERY_KEYS.studentsByStaff(staffId));
        if (cachedStaffStudents && Array.isArray(cachedStaffStudents) && cachedStaffStudents.length > 0) {
          console.log("♻️ Staff View: Using cached students! (0 Reads)");
          return cachedStaffStudents;
        }

        // Check master list for filtering
        const allStudents = queryClient.getQueryData(QUERY_KEYS.students());
        if (allStudents && Array.isArray(allStudents) && allStudents.length > 0) {
          const staffStudents = allStudents.filter(s =>
            s.assignedStaffIds && s.assignedStaffIds.includes(staffId)
          );
          if (staffStudents.length > 0) {
            console.log("♻️ Staff View: Found students in master cache! (0 Reads)");
            seedStudentCache(queryClient, staffStudents);
            return staffStudents;
          }
        }

        console.log("📋 Staff View: Fetching staff's students from DB");
        const staffStudents = await childService.getChildrenByStaffId(staffId);
        seedStudentCache(queryClient, staffStudents);
        return staffStudents;
      }

      // ─────────────────────────────────────────────────────────────────
      // PARENT VIEW: Only fetch parent's children
      // ─────────────────────────────────────────────────────────────────
      if (isParentView && parentId) {
        // Check if we already have data in the master list
        const allStudents = queryClient.getQueryData(QUERY_KEYS.students());
        if (allStudents && Array.isArray(allStudents) && allStudents.length > 0) {
          const parentChildren = allStudents.filter(s => s.parentId === parentId);
          if (parentChildren.length > 0) {
            console.log("♻️ Parent View: Found children in master cache! (0 Reads)");
            return parentChildren;
          }
        }
        console.log("📋 Parent View: Fetching parent's children from DB");
        const children = await childService.getChildrenByParentId(parentId);
        seedStudentCache(queryClient, children);
        return children;
      }

      // ─────────────────────────────────────────────────────────────────
      // ADMIN VIEW: Fetch all students (default)
      // ─────────────────────────────────────────────────────────────────
      const existingData = queryClient.getQueryData(QUERY_KEYS.students());
      if (existingData && Array.isArray(existingData) && existingData.length > 0) {
        console.log("♻️ Admin View: Using cached students! (0 Reads)");
        return existingData;
      }

      console.log("📋 Admin View: Fetching all students from DB");
      const allStudents = await childService.getAllChildren();
      // Seed individual cache for free lookups when clicking a student
      seedStudentCache(queryClient, allStudents);
      return allStudents;
    },
    initialData: passedStudent ? [passedStudent] : undefined,
    ...QUERY_OPTIONS.semiStatic, // Use consistent cache options
  });

  // Ensure students is always an array (handle edge cases from cache)
  const students = useMemo(() => {
    if (!studentsData) return [];
    if (Array.isArray(studentsData)) return studentsData;
    // If cached data is a single object, wrap in array
    return [studentsData];
  }, [studentsData]);

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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.students() });
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
