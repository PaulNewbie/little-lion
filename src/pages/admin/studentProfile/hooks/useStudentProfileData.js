import { useState, useMemo } from "react";
// 1. Add useQueryClient
import { useQuery, useQueryClient } from "@tanstack/react-query";
import childService from "../../../../services/childService";
import activityService from "../../../../services/activityService";
import userService from "../../../../services/userService";

export const useStudentProfileData = (locationState) => {
  // 2. Initialize QueryClient
  const queryClient = useQueryClient();

  const passedStudent = locationState?.student || null;
  const passedActivities = locationState?.activities || [];

  const [selectedStudentId, setSelectedStudentId] = useState(passedStudent?.id || null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  // --- CACHED QUERIES ---

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ["students"],
    queryFn: () => childService.getAllChildren(),
    initialData: passedStudent ? [passedStudent] : undefined,
  });

  const { data: studentActivities = [] } = useQuery({
    queryKey: ["activities", selectedStudentId],
    queryFn: async () => {
      const activities = await activityService.getActivitiesByChild(selectedStudentId);
      return activities
        .map((act) => ({
          ...act,
          participatingStudentsNames: act.participatingStudentIds
            ? act.participatingStudentIds.map(() => "Student")
            : [act.studentName],
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    },
    enabled: !!selectedStudentId,
    initialData: passedActivities.length > 0 ? passedActivities : undefined,
  });

  // Derived State
  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return students.find((s) => s.id === selectedStudentId) || passedStudent;
  }, [students, selectedStudentId, passedStudent]);

  const { data: parentData = null } = useQuery({
    queryKey: ["parent", selectedStudent?.parentId],
    queryFn: () => userService.getUserById(selectedStudent.parentId),
    enabled: !!selectedStudent?.parentId,
  });

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      const matchesSearch = fullName.includes(searchTerm.toLowerCase());
      const hasTherapy = student.enrolledServices?.some((s) => s.type === "Therapy") || student.therapyServices?.length > 0;
      const hasGroup = student.enrolledServices?.some((s) => s.type === "Class") || student.groupClasses?.length > 0;

      if (filterType === "therapy") return matchesSearch && hasTherapy;
      if (filterType === "group") return matchesSearch && hasGroup;
      if (filterType === "none") return matchesSearch && !hasTherapy && !hasGroup;
      return matchesSearch;
    });
  }, [students, searchTerm, filterType]);

  const handleSetSelectedStudent = (student) => {
    setSelectedStudentId(student ? student.id : null);
  };

  // 3. NEW: Refresh Function (Fixes 'refreshData' crash)
  const refreshData = () => {
    return queryClient.invalidateQueries({ queryKey: ["students"] });
  };

  return {
    students,
    loading: loadingStudents,
    selectedStudent,
    setSelectedStudent: handleSetSelectedStudent,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    filteredStudents,
    studentActivities,
    parentData,
    refreshData, // ✅ Now it exists!
    // fetchStudentActivities is intentionally REMOVED
  };
};