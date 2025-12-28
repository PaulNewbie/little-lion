import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import childService from "../../../../services/childService";
import activityService from "../../../../services/activityService";
import userService from "../../../../services/userService";

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
  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: () => childService.getAllChildren(),
    initialData: passedStudent ? [passedStudent] : undefined,
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
  const refreshData = () =>
    queryClient.invalidateQueries({ queryKey: ["students"] });

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
    refreshData,
  };
};
