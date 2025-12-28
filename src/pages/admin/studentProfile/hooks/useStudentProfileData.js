import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query"; // ✅ Import this
import childService from "../../../../services/childService";
import activityService from "../../../../services/activityService";
import userService from "../../../../services/userService";

export const useStudentProfileData = (locationState) => {
  const passedStudent = locationState?.student || null;
  const passedActivities = locationState?.activities || [];

  const [selectedStudentId, setSelectedStudentId] = useState(passedStudent?.id || null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  // 1. ✅ CACHED: Fetch All Students
  // If we already have this data in cache from the Dashboard, it won't even fetch!
  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ["students"],
    queryFn: () => childService.getAllChildren(),
    initialData: passedStudent ? [passedStudent] : undefined, // Show passed student immediately
  });

  // 2. ✅ CACHED: Fetch Activities (Dependent Query)
  // This ONLY runs when `selectedStudentId` is not null
  const { data: studentActivities = [] } = useQuery({
    queryKey: ["activities", selectedStudentId],
    queryFn: async () => {
      const activities = await activityService.getActivitiesByChild(selectedStudentId);
      // Process data right here
      return activities
        .map((act) => ({
          ...act,
          participatingStudentsNames: act.participatingStudentIds
            ? act.participatingStudentIds.map(() => "Student")
            : [act.studentName],
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    },
    enabled: !!selectedStudentId, // ⚠️ Wait until we have an ID
    initialData: passedActivities.length > 0 ? passedActivities : undefined,
  });

  // 3. ✅ CACHED: Fetch Parent Data
  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return students.find((s) => s.id === selectedStudentId) || passedStudent;
  }, [students, selectedStudentId, passedStudent]);

  const { data: parentData = null } = useQuery({
    queryKey: ["parent", selectedStudent?.parentId],
    queryFn: () => userService.getUserById(selectedStudent.parentId),
    enabled: !!selectedStudent?.parentId,
  });

  // 4. Filter Logic (Standard React, no changes needed here)
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      const matchesSearch = fullName.includes(searchTerm.toLowerCase());
      
      const hasTherapy = student.oneOnOneServices?.length > 0; // Simplified check based on new data structure
      const hasGroup = student.groupClassServices?.length > 0;

      if (filterType === "therapy") return matchesSearch && hasTherapy;
      if (filterType === "group") return matchesSearch && hasGroup;
      if (filterType === "none") return matchesSearch && !hasTherapy && !hasGroup;

      return matchesSearch;
    });
  }, [students, searchTerm, filterType]);

  const handleSetSelectedStudent = (student) => {
    setSelectedStudentId(student ? student.id : null);
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
  };
};