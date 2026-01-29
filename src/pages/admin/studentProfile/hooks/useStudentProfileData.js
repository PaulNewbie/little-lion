import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import childService from "../../../../services/childService";
import activityService from "../../../../services/activityService";
import userService from "../../../../services/userService";
import assessmentService from "../../../../services/assessmentService";
import { QUERY_KEYS, QUERY_OPTIONS } from "../../../../config/queryClient";

// =============================================================================
// CONFIG
// =============================================================================
const PAGE_SIZE = 10; // 10 students per page
const SEARCH_DEBOUNCE_MS = 300; // Debounce delay for server search
const MIN_SEARCH_LENGTH = 2; // Minimum characters before server search

// =============================================================================
// HELPER: CACHE SEEDING - Seeds individual student cache for free profile lookups
// =============================================================================
const seedStudentCache = (queryClient, students) => {
  if (!students || !Array.isArray(students)) return;

  students.forEach(student => {
    if (student && student.id) {
      // Only seed if not already in cache (avoid overwriting fresher data)
      const existing = queryClient.getQueryData(QUERY_KEYS.student(student.id));
      if (!existing) {
        queryClient.setQueryData(QUERY_KEYS.student(student.id), student);
      }
    }
  });
};

// =============================================================================
// HELPER: Check if student is already loaded (in any cache)
// =============================================================================
const isStudentCached = (queryClient, studentId) => {
  // Check individual cache
  if (queryClient.getQueryData(QUERY_KEYS.student(studentId))) {
    return true;
  }
  // Check main students list
  const studentsList = queryClient.getQueryData(QUERY_KEYS.students());
  if (studentsList?.students?.some(s => s.id === studentId)) {
    return true;
  }
  return false;
};

// =============================================================================
// HELPER: Get student from any cache
// =============================================================================
const getStudentFromCache = (queryClient, studentId) => {
  // Check individual cache first
  const individual = queryClient.getQueryData(QUERY_KEYS.student(studentId));
  if (individual) return individual;

  // Check main students list
  const studentsList = queryClient.getQueryData(QUERY_KEYS.students());
  if (studentsList?.students) {
    const found = studentsList.students.find(s => s.id === studentId);
    if (found) return found;
  }

  return null;
};

// =============================================================================
// HELPER: DEBOUNCE HOOK
// =============================================================================
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

/**
 * @param {Object} locationState - React Router location state
 * @param {Object} options - Additional options
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

  // Pagination state (for admin view only)
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Debounced search term for server-side search
  const debouncedSearchTerm = useDebounce(searchTerm, SEARCH_DEBOUNCE_MS);

  // Determine if this is admin view (paginated)
  const isAdminView = !isParentView && !isStaffView && !singleStudentMode;

  // ================= DETERMINE QUERY KEY =================
  const getQueryKey = () => {
    if (singleStudentMode && passedStudent) {
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

  // ================= STUDENTS (Paginated/Role-based) =================
  const { data: studentsData, isLoading } = useQuery({
    queryKey: getQueryKey(),
    queryFn: async () => {
      // SINGLE STUDENT MODE
      if (singleStudentMode && passedStudent) {
        queryClient.setQueryData(QUERY_KEYS.student(passedStudent.id), passedStudent);
        return { students: [passedStudent], lastDoc: null, hasMore: false };
      }

      // STAFF VIEW
      if (isStaffView && staffId) {
        const cachedStaffStudents = queryClient.getQueryData(QUERY_KEYS.studentsByStaff(staffId));
        if (cachedStaffStudents) {
          const arr = cachedStaffStudents.students || cachedStaffStudents;
          if (Array.isArray(arr) && arr.length > 0) {
            return { students: arr, lastDoc: null, hasMore: false };
          }
        }
        const staffStudents = await childService.getChildrenByStaffId(staffId);
        seedStudentCache(queryClient, staffStudents);
        return { students: staffStudents, lastDoc: null, hasMore: false };
      }

      // PARENT VIEW
      if (isParentView && parentId) {
        const children = await childService.getChildrenByParentId(parentId);
        seedStudentCache(queryClient, children);
        return { students: children, lastDoc: null, hasMore: false };
      }

      // ADMIN VIEW: Paginated fetch
      const existingData = queryClient.getQueryData(QUERY_KEYS.students());
      if (existingData?.students && existingData.students.length > 0) {
        return existingData;
      }

      const result = await childService.getChildrenPaginated({ limit: PAGE_SIZE });
      seedStudentCache(queryClient, result.students);
      return result;
    },
    initialData: passedStudent
      ? { students: [passedStudent], lastDoc: null, hasMore: false }
      : undefined,
    ...QUERY_OPTIONS.semiStatic,
  });

  // Extract students array from query result
  const loadedStudents = useMemo(() => {
    if (!studentsData) return [];
    if (studentsData.students) return studentsData.students;
    if (Array.isArray(studentsData)) return studentsData;
    return [];
  }, [studentsData]);

  // Update pagination state when data changes
  useEffect(() => {
    if (studentsData && isAdminView) {
      setLastDoc(studentsData.lastDoc || null);
      setHasMore(studentsData.hasMore || false);
    }
  }, [studentsData, isAdminView]);

  // ================= SERVER-SIDE SEARCH (Admin only) =================
  const shouldServerSearch = isAdminView && debouncedSearchTerm.length >= MIN_SEARCH_LENGTH;

  const { data: searchResults = [], isFetching: isSearching } = useQuery({
    queryKey: ['students', 'search', debouncedSearchTerm],
    queryFn: async () => {
      // First, check if we can find matching students in the already-loaded list
      const searchLower = debouncedSearchTerm.toLowerCase();
      const localMatches = loadedStudents.filter(s => {
        const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
        return fullName.includes(searchLower);
      });

      // If we have enough local matches, skip server search
      if (localMatches.length >= 5) {
        return []; // Let local filtering handle it
      }

      // Fetch from server for students not in local list
      const serverResults = await childService.searchChildren(debouncedSearchTerm, 10);

      // Filter out students we already have loaded (avoid duplicates)
      const loadedIds = new Set(loadedStudents.map(s => s.id));
      const newResults = serverResults.filter(s => !loadedIds.has(s.id));

      // Seed only the new results into cache
      seedStudentCache(queryClient, newResults);

      return newResults;
    },
    enabled: shouldServerSearch,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (renamed from cacheTime in v5)
  });

  // ================= LOAD MORE (Pagination) =================
  const handleLoadMore = useCallback(async () => {
    if (!isAdminView || !hasMore || isLoadingMore || !lastDoc) return;

    setIsLoadingMore(true);
    try {
      const moreData = await childService.getChildrenPaginated({
        limit: PAGE_SIZE,
        startAfter: lastDoc
      });

      // Get current loaded student IDs to avoid duplicates
      const currentData = queryClient.getQueryData(QUERY_KEYS.students());
      const existingIds = new Set((currentData?.students || []).map(s => s.id));

      // Filter out any students that might already be loaded (from search)
      const newStudents = moreData.students.filter(s => !existingIds.has(s.id));

      // Seed only truly new students
      seedStudentCache(queryClient, newStudents);

      // Append all students (pagination order matters for cursor)
      queryClient.setQueryData(QUERY_KEYS.students(), (old) => ({
        students: [...(old?.students || []), ...moreData.students],
        lastDoc: moreData.lastDoc,
        hasMore: moreData.hasMore,
      }));

      setLastDoc(moreData.lastDoc);
      setHasMore(moreData.hasMore);
    } catch (error) {
      console.error("Load more error:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isAdminView, hasMore, isLoadingMore, lastDoc, queryClient]);

  // ================= AUTO SELECT FROM NAV =================
  useEffect(() => {
    if (locationState?.studentId) {
      setSelectedStudentId(locationState.studentId);
    }
  }, [locationState?.studentId]);

  // ================= SELECTED STUDENT =================
  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    // Check loaded students first, then search results
    return loadedStudents.find((s) => s.id === selectedStudentId)
      || searchResults.find((s) => s.id === selectedStudentId)
      || passedStudent;
  }, [loadedStudents, searchResults, selectedStudentId, passedStudent]);

  // ================= ACTIVITIES =================
  const { data: studentActivities = [] } = useQuery({
    queryKey: ["activities", selectedStudentId],
    queryFn: async () => {
      const acts = await activityService.getActivitiesByChild(selectedStudentId);
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
      return await assessmentService.getAssessment(selectedStudent.assessmentId);
    },
    enabled: !!selectedStudent?.assessmentId,
  });

  // ================= COMBINED & FILTERED STUDENTS =================
  const filteredStudents = useMemo(() => {
    // Start with loaded students
    let combined = [...loadedStudents];

    // If searching, merge in server search results (deduplicated)
    if (shouldServerSearch && searchResults.length > 0) {
      const loadedIds = new Set(loadedStudents.map(s => s.id));
      const newFromSearch = searchResults.filter(s => !loadedIds.has(s.id));
      combined = [...combined, ...newFromSearch];
    }

    // Apply filters
    return combined.filter((s) => {
      // Name filter (local + server results)
      const name = `${s.firstName} ${s.lastName}`.toLowerCase();
      if (searchTerm && !name.includes(searchTerm.toLowerCase())) return false;

      // Service type filter
      const hasTherapy =
        s.enrolledServices?.some((x) => x.type === "Therapy") ||
        s.serviceEnrollments?.some((x) => x.serviceType === "Therapy" && x.status === "active") ||
        s.oneOnOneServices?.length > 0;

      const hasGroup =
        s.enrolledServices?.some((x) => x.type === "Class") ||
        s.serviceEnrollments?.some((x) => x.serviceType === "Class" && x.status === "active") ||
        s.groupClassServices?.length > 0;

      if (filterType === "therapy") return hasTherapy;
      if (filterType === "group") return hasGroup;
      if (filterType === "none") return !hasTherapy && !hasGroup;
      return true;
    });
  }, [loadedStudents, searchResults, shouldServerSearch, searchTerm, filterType]);

  // ================= HELPERS =================
  const refreshData = useCallback(async () => {
    const invalidations = [];

    if (isParentView && parentId) {
      invalidations.push(queryClient.invalidateQueries({ queryKey: QUERY_KEYS.studentsByParent(parentId) }));
    } else if (isStaffView && staffId) {
      invalidations.push(queryClient.invalidateQueries({ queryKey: QUERY_KEYS.studentsByStaff(staffId) }));
    } else {
      invalidations.push(queryClient.invalidateQueries({ queryKey: QUERY_KEYS.students() }));
    }

    if (selectedStudent?.assessmentId) {
      invalidations.push(queryClient.invalidateQueries({ queryKey: ["assessment", selectedStudent.assessmentId] }));
    }

    // Also invalidate service enrollment queries for the selected student
    if (selectedStudentId) {
      invalidations.push(queryClient.invalidateQueries({ queryKey: ['serviceEnrollments', selectedStudentId] }));
      invalidations.push(queryClient.invalidateQueries({ queryKey: ['staffHistory', selectedStudentId] }));
      invalidations.push(queryClient.invalidateQueries({ queryKey: ['student', selectedStudentId] }));
    }

    await Promise.all(invalidations);
  }, [queryClient, isParentView, parentId, isStaffView, staffId, selectedStudent, selectedStudentId]);

  // Expose all loaded students (for display count)
  const students = loadedStudents;

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
    // Pagination (admin view only)
    hasMore: isAdminView && !searchTerm ? hasMore : false, // Hide "Load More" when searching
    handleLoadMore: isAdminView ? handleLoadMore : undefined,
    isLoadingMore,
    // Search state
    isSearching: shouldServerSearch && isSearching,
  };
};
