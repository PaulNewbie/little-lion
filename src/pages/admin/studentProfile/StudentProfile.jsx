// src/pages/admin/studentProfile/StudentProfile.jsx
import React, { useState, useRef, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../hooks/useAuth";
import { useToast } from "../../../context/ToastContext";
import Sidebar from '../../../components/sidebar/Sidebar';
import { getAdminConfig, getParentConfig, getTeacherConfig, getTherapistConfig } from '../../../components/sidebar/sidebarConfigs';
import GeneralFooter from "../../../components/footer/generalfooter";
import childService from "../../../services/childService";
import offeringsService from "../../../services/offeringsService";
import userService from "../../../services/userService";
import cloudinaryService from "../../../services/cloudinaryService";
import { useTeachers, useTherapists } from "../../../hooks/useRoleBasedData";
import { useStudentProfileData } from "./hooks/useStudentProfileData";
import AssessmentHistoryModal from "../../shared/AssessmentHistoryModal";
import Loading from "../../../components/common/Loading";
import { ServiceEnrollmentsPanel } from "../../../components/serviceEnrollments";
import { CurrentTeamSection } from "../../../components/staffCredentials";

// Local components
import {
  ActivityCalendar,
  StudentListView,
  StudentProfileHeader,
  AddServiceModal
} from "./components";

import "./StudentProfile.css";
import "../../../components/common/Header.css";

const StudentProfile = ({
  isParentView = false,
  childIdFromRoute = null,
  hideSidebar = false,
  noContainer = false,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const toast = useToast();
  const calendarRef = useRef(null);

  // Navigation state
  const studentIdFromEnrollment = location.state?.studentId;
  const fromEnrollment = location.state?.fromEnrollment;
  const parentFromEnrollment = location.state?.parent;
  const isStaffViewFromNav = location.state?.isStaffView;
  const studentFromNav = location.state?.student;

  // Determine view type
  const isStaffRole = currentUser?.role === 'therapist' || currentUser?.role === 'teacher';
  const isStaffView = isStaffViewFromNav || (isStaffRole && !isParentView);
  const singleStudentMode = !!(studentFromNav && isStaffView);

  // Data hook
  const {
    loading,
    selectedStudent,
    setSelectedStudent,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    filteredStudents,
    studentActivities,
    refreshData,
    parentData,
    assessmentData,
    isAssessmentLoading,
    hasMore,
    handleLoadMore,
    isLoadingMore,
    isSearching
  } = useStudentProfileData(location.state, {
    isParentView,
    parentId: isParentView ? currentUser?.uid : null,
    isStaffView: isStaffView && !singleStudentMode,
    staffId: isStaffView ? currentUser?.uid : null,
    singleStudentMode
  });

  // UI State
  const [viewMode, setViewMode] = useState(
    (studentIdFromEnrollment || selectedStudent || childIdFromRoute) ? "profile" : "list"
  );
  const [selectedService, setSelectedService] = useState("");
  const [showAssessment, setShowAssessment] = useState(false);
  const [ignoreRouteChild, setIgnoreRouteChild] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [availableServices, setAvailableServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [currentServiceType, setCurrentServiceType] = useState(null);
  const [addForm, setAddForm] = useState({ serviceId: "", staffId: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Staff Data (lazy loaded)
  const shouldFetchStaff = !isParentView && isAddModalOpen;
  const { data: teachers, isLoading: loadingTeachers } = useTeachers({ enabled: shouldFetchStaff });
  const { data: therapists, isLoading: loadingTherapists } = useTherapists({ enabled: shouldFetchStaff });
  const combinedStaff = useMemo(() => [...(teachers || []), ...(therapists || [])], [teachers, therapists]);

  // === Effects ===

  // Auto-load child for parent view
  useEffect(() => {
    if (isParentView && childIdFromRoute && !selectedStudent && !ignoreRouteChild) {
      const loadChildForParent = async () => {
        try {
          const children = await childService.getChildrenByParentId(currentUser.uid);
          const child = children.find(c => c.id === childIdFromRoute);
          if (!child) {
            toast.error("Child not found or access denied");
            navigate("/parent/dashboard");
            return;
          }
          setSelectedStudent(child);
          setViewMode("profile");
        } catch (error) {
          console.error("Error loading child:", error);
          navigate("/parent/dashboard");
        }
      };
      loadChildForParent();
    }
  }, [isParentView, childIdFromRoute, selectedStudent, currentUser, navigate, setSelectedStudent, ignoreRouteChild]);

  useEffect(() => {
    if (studentIdFromEnrollment && selectedStudent) {
      setViewMode("profile");
    }
  }, [studentIdFromEnrollment, selectedStudent]);

  // Auto-select single child for parent
  useEffect(() => {
    if (isParentView && !loading && !selectedStudent && !childIdFromRoute && !ignoreRouteChild) {
      const parentChildren = filteredStudents.filter((s) => s.parentId === currentUser?.uid);
      if (parentChildren.length === 1) {
        setSelectedStudent(parentChildren[0]);
        setViewMode("profile");
      }
    }
  }, [isParentView, loading, filteredStudents, currentUser, selectedStudent, childIdFromRoute, ignoreRouteChild, setSelectedStudent]);

  // === Handlers ===

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setViewMode("profile");
    setShowAssessment(false);
    setSelectedService("");
  };

  const handleBack = () => {
    if (isParentView) {
      setIgnoreRouteChild(true);
      setSelectedStudent(null);
      setViewMode("list");
      return;
    }
    if (location.state?.fromOneOnOne) {
      navigate("/admin/one-on-one", {
        state: {
          returnToService: location.state.selectedService || location.state.selectedServiceFromOneOnOne
        }
      });
    } else if (fromEnrollment) {
      navigate("/admin/enrollment", { state: { selectedParent: parentFromEnrollment } });
    } else if (currentUser?.role === 'therapist') {
      navigate('/therapist/dashboard');
    } else if (currentUser?.role === 'teacher') {
      navigate('/teacher/dashboard');
    } else {
      setSelectedStudent(null);
      setViewMode("list");
    }
  };

  const handleServiceClick = (serviceName) => {
    setSelectedService(serviceName);
    setTimeout(() => {
      calendarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleToggleAssessment = () => {
    setShowAssessment(!showAssessment);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      toast.error('Please upload a JPG or PNG image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB.');
      return;
    }
    setUploadingPhoto(true);
    try {
      const photoUrl = await cloudinaryService.uploadImage(file, 'little-lions/children');
      await childService.updateChildPhoto(selectedStudent.id, currentUser.uid, photoUrl);
      setSelectedStudent(prev => ({ ...prev, photoUrl }));
      await refreshData();
      toast.success('Photo uploaded successfully!');
    } catch (error) {
      console.error('Photo upload failed:', error);
      toast.error('Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // === SERVICE ENROLLMENT HANDLERS ===

  const handleOpenAddModal = () => {
    if (isParentView) return;
    setIsAddModalOpen(true);
    setAvailableServices([]);
    setAddForm({ serviceId: "", staffId: "" });
    setCurrentServiceType(null);
  };

  const handleLoadServices = async (type) => {
    setLoadingServices(true);
    setCurrentServiceType(type);

    try {
      // 1. Fetch fresh student data to get current enrollments
      const freshStudent = await childService.getChildById(selectedStudent.id);
      
      // 2. Fetch all services of this type
      const services = await offeringsService.getServicesByType(type);

      // 3. Get intervention service IDs from assessment (Background History)
      const interventions = assessmentData?.backgroundHistory?.interventions || [];
      const savedServiceIds = [
        ...new Set(
          interventions
            .filter((i) => i.serviceType === type && i.serviceId)
            .map((i) => i.serviceId)
        ),
      ];

      // 4. Get ALL currently enrolled service IDs for this student (from fresh data)
      const enrolledServiceIds = new Set();

      // Legacy: oneOnOneServices
      (freshStudent?.oneOnOneServices || []).forEach((s) => {
        if (s.serviceId) enrolledServiceIds.add(s.serviceId);
      });

      // Legacy: groupClassServices
      (freshStudent?.groupClassServices || []).forEach((s) => {
        if (s.serviceId) enrolledServiceIds.add(s.serviceId);
      });

      // Legacy: enrolledServices
      (freshStudent?.enrolledServices || []).forEach((s) => {
        if (s.serviceId) enrolledServiceIds.add(s.serviceId);
      });

      // New: serviceEnrollments (only exclude ACTIVE enrollments)
      (freshStudent?.serviceEnrollments || []).forEach((e) => {
        if (e.serviceId && e.status === "active") {
          enrolledServiceIds.add(e.serviceId);
        }
      });

      // 5. Filter: must be in interventions AND not already enrolled
      const filtered = services.filter(
        (s) => savedServiceIds.includes(s.id) && !enrolledServiceIds.has(s.id)
      );

      setAvailableServices(filtered);
    } catch (error) {
      console.error("Error loading services:", error);
      toast.error("Error loading services: " + error.message);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleAddSubmit = async (serviceType) => {
    if (!addForm.serviceId || !addForm.staffId) {
      toast.warning("Please select both a service and staff member.");
      return;
    }

    setIsSubmitting(true);
    try {
      const serviceObj = availableServices.find((s) => s.id === addForm.serviceId);
      const isTherapy = serviceType === "Therapy";
      const staffList = isTherapy ? therapists : teachers;
      const staffObj = staffList?.find((s) => (s.uid || s.id) === addForm.staffId);

      if (!staffObj) throw new Error("Staff member not found.");

      // Use addServiceEnrollment (new data model)
      await childService.addServiceEnrollment(
        selectedStudent.id,
        {
          serviceId: serviceObj.id,
          serviceName: serviceObj.name,
          serviceType: serviceType,
          staff: {
            staffId: addForm.staffId,
            staffName: `${staffObj.firstName} ${staffObj.lastName}`,
            staffRole: isTherapy ? "therapist" : "teacher",
          },
        },
        currentUser.uid
      );

      // Update staff specializations (add if not already present)
      const currentSpecs = staffObj.specializations || [];
      if (!currentSpecs.includes(serviceObj.name)) {
        await userService.updateUser(addForm.staffId, {
          specializations: [...currentSpecs, serviceObj.name]
        });
      }

      // Invalidate all related caches for immediate UI update
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['serviceEnrollments', selectedStudent.id] }),
        queryClient.invalidateQueries({ queryKey: ['staffHistory', selectedStudent.id] }),
        queryClient.invalidateQueries({ queryKey: ['student', selectedStudent.id] }),
        refreshData(),
      ]);

      setIsAddModalOpen(false);
      toast.success("Service enrolled successfully!");
    } catch (err) {
      console.error("Enrollment failed:", err);
      toast.error("Failed to enroll service: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // === Computed Values ===

  const getQualifiedStaff = (serviceName, serviceType) => {
    if (!serviceName || !serviceType || loadingTeachers || loadingTherapists) return [];
    const staffList = serviceType === "Therapy" ? therapists : teachers;
    if (!staffList) return [];
    return staffList.filter((staff) =>
      !staff.specializations ||
      staff.specializations.length === 0 ||
      staff.specializations.some(
        (spec) => spec.trim().toLowerCase() === serviceName.trim().toLowerCase()
      )
    );
  };

  const effectiveFilteredStudents = isParentView
    ? filteredStudents.filter((s) => s.parentId === currentUser.uid)
    : filteredStudents;

  const getSidebarConfig = () => {
    if (isParentView) return getParentConfig();
    switch (currentUser?.role) {
      case 'therapist': return getTherapistConfig();
      case 'teacher': return getTeacherConfig();
      case 'super_admin': return getAdminConfig(true);
      default: return getAdminConfig(false);
    }
  };

  const getForceActive = () => {
    switch (currentUser?.role) {
      case 'therapist': return '/therapist/dashboard';
      case 'teacher': return '/teacher/dashboard';
      default: return '/admin/StudentProfile';
    }
  };

  // === Render ===

  const mainContent = (
    <div className="sp-main">
      <div className="sp-page">
          {/* LIST VIEW */}
          {viewMode === "list" && (
            <StudentListView
              isParentView={isParentView}
              students={effectiveFilteredStudents}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filterType={filterType}
              onFilterChange={setFilterType}
              onSelectStudent={handleSelectStudent}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
              isLoadingMore={isLoadingMore}
              isSearching={isSearching}
            />
          )}

          {/* PROFILE VIEW */}
          {viewMode === "profile" && selectedStudent && (
            <div className="sp-content-area">
              <div className="profile-wrapper">
                <StudentProfileHeader
                  student={selectedStudent}
                  parentData={parentData}
                  isParentView={isParentView}
                  uploadingPhoto={uploadingPhoto}
                  onBack={handleBack}
                  onPhotoUpload={handlePhotoUpload}
                  onToggleAssessment={handleToggleAssessment}
                />

                <div className="profile-content-scroll">
                  {/* Service Enrollments Panel */}
                  <ServiceEnrollmentsPanel
                    childId={selectedStudent.id}
                    onServiceClick={handleServiceClick}
                    selectedService={selectedService}
                    isReadOnly={isParentView || isStaffView}
                    onAddService={!isParentView && !isStaffView ? handleOpenAddModal : undefined}
                    viewerRole={isParentView ? 'parent' : currentUser?.role}
                    viewerId={currentUser?.uid}
                  />

                  {/* Activity Calendar */}
                  {selectedService && (
                    <div ref={calendarRef}>
                      <ActivityCalendar
                        activities={studentActivities.filter(
                          (a) => a.serviceName === selectedService || a.serviceType === selectedService || a.className === selectedService
                        )}
                        teachers={combinedStaff}
                        selectedServiceName={selectedService}
                      />
                    </div>
                  )}

                  {/* Care Team - Parent view only */}
                  {isParentView && (
                    <CurrentTeamSection student={selectedStudent} />
                  )}
                </div>
              </div>
            </div>
          )}

        <GeneralFooter pageLabel={isParentView ? "Child Profile" : "Student Profile"} />
      </div>

      {/* Assessment History Modal */}
      <AssessmentHistoryModal
        isOpen={showAssessment}
        onClose={() => setShowAssessment(false)}
        childData={selectedStudent}
        assessmentData={assessmentData}
        isLoading={isAssessmentLoading}
      />

      {/* Add Service Modal */}
      <AddServiceModal
        isOpen={!isParentView && isAddModalOpen}
        onLoadServices={handleLoadServices}
        availableServices={availableServices}
        loadingServices={loadingServices}
        formData={addForm}
        onFormChange={setAddForm}
        qualifiedStaff={getQualifiedStaff(
          availableServices.find((s) => s.id === addForm.serviceId)?.name,
          currentServiceType
        )}
        isLoadingStaff={loadingTeachers || loadingTherapists}
        isSubmitting={isSubmitting}
        onSubmit={handleAddSubmit}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );

  // Container handling
  if (noContainer) return mainContent;
  if (hideSidebar) return <div className="sp-container">{mainContent}</div>;

  return (
    <div className="sp-container">
      <Sidebar {...getSidebarConfig()} forceActive={getForceActive()} />
      {loading ? (
        <Loading role="admin" message="Loading students" variant="content" />
      ) : (
        mainContent
      )}
    </div>
  );
};

export default StudentProfile;