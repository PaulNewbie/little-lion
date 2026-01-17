import React, { useState, useRef, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import Sidebar from '../../../components/sidebar/Sidebar';
import { getAdminConfig, getParentConfig, getTeacherConfig, getTherapistConfig } from '../../../components/sidebar/sidebarConfigs';
import GeneralFooter from "../../../components/footer/generalfooter";
import childService from "../../../services/childService";
import offeringsService from "../../../services/offeringsService";
import userService from "../../../services/userService";
import { useTeachers, useTherapists } from "../../../hooks/useRoleBasedData";
import { useStudentProfileData } from "./hooks/useStudentProfileData";
import AssessmentHistory from "../../shared/AssessmentHistory";
import ActivityCalendar from "./components/ActivityCalendar";
import Loading from "../../../components/common/Loading";
import { ServiceEnrollmentsPanel } from "../../../components/serviceEnrollments";
import "./StudentProfile.css";

const StudentProfile = ({ 
  isParentView = false,
  childIdFromRoute = null,
  hideSidebar = false,
  noContainer = false,
}) => {
  useEffect(() => {
    console.log("StudentProfile mounted", { isParentView, childIdFromRoute });
  }, [isParentView, childIdFromRoute]);

  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const studentIdFromEnrollment = location.state?.studentId;
  const fromEnrollment = location.state?.fromEnrollment;
  const parentFromEnrollment = location.state?.parent;
  const isStaffViewFromNav = location.state?.isStaffView;
  const studentFromNav = location.state?.student;

  // Determine if this is a staff view (therapist/teacher viewing their student)
  const isStaffRole = currentUser?.role === 'therapist' || currentUser?.role === 'teacher';
  const isStaffView = isStaffViewFromNav || (isStaffRole && !isParentView);

  // Single student mode: when navigating directly to view one student (no need to fetch list)
  const singleStudentMode = !!(studentFromNav && isStaffView);

  // 1. THE CUSTOM HOOK (Data & Pagination)
  // OPTIMIZED: Pass view mode so it fetches only the relevant students
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
    handleLoadMore
  } = useStudentProfileData(location.state, {
    isParentView,
    parentId: isParentView ? currentUser?.uid : null,
    isStaffView: isStaffView && !singleStudentMode, // If single student mode, don't need staff view
    staffId: isStaffView ? currentUser?.uid : null,
    singleStudentMode
  });

  // 2. UI State
  const [viewMode, setViewMode] = useState(
    (studentIdFromEnrollment || selectedStudent || childIdFromRoute) ? "profile" : "list"
  );
  const [selectedService, setSelectedService] = useState("");
  const [showAssessment, setShowAssessment] = useState(false);
  const [ignoreRouteChild, setIgnoreRouteChild] = useState(false);
  
  // 3. Modal State (Moved UP so hooks can use it)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addServiceType, setAddServiceType] = useState(null);
  const [availableServices, setAvailableServices] = useState([]);
  const [addForm, setAddForm] = useState({ serviceId: "", staffId: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const calendarRef = useRef(null);

  // 4. Staff Data (LAZY LOAD OPTIMIZATION)
  // Only fetch staff when the Add Modal is open. 
  // This prevents reading all 50+ users just by viewing a student profile.
  const shouldFetchStaff = !isParentView && isAddModalOpen;

  const { data: teachers, isLoading: loadingTeachers } = useTeachers({ 
    enabled: shouldFetchStaff 
  });
  
  const { data: therapists, isLoading: loadingTherapists } = useTherapists({ 
    enabled: shouldFetchStaff 
  });
  
  const combinedStaff = useMemo(() => {
    return [...(teachers || []), ...(therapists || [])];
  }, [teachers, therapists]);

  // Auto-load child for parent view
  useEffect(() => {
    if (isParentView && childIdFromRoute && !selectedStudent && !ignoreRouteChild) {
      const loadChildForParent = async () => {
        try {
          const children = await childService.getChildrenByParentId(currentUser.uid);
          const child = children.find(c => c.id === childIdFromRoute);
          
          if (!child) {
            alert("Child not found or access denied");
            navigate("/parent/dashboard");
            return;
          }
          
          setSelectedStudent(child);
          setViewMode("profile");
        } catch (error) {
          console.error("Error loading child:", error);
          alert("Failed to load child data");
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

  // --- Handlers ---
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

    // Handle navigation based on where user came from
    if (location.state?.fromOneOnOne) {
      navigate("/admin/one-on-one", {
        state: { ...location.state, level: "students" },
      });
    } else if (fromEnrollment) {
      navigate("/admin/enrollment", {
        state: {
          selectedParent: parentFromEnrollment,
        },
      });
    } else if (currentUser?.role === 'therapist') {
      // Therapist goes back to their dashboard
      navigate('/therapist/dashboard');
    } else if (currentUser?.role === 'teacher') {
      // Teacher goes back to their dashboard
      navigate('/teacher/dashboard');
    } else {
      setSelectedStudent(null);
      setViewMode("list");
    }
  };

  const handleServiceClick = (serviceName) => {
    setSelectedService(serviceName);
    setTimeout(() => {
      calendarRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  // Admin-only: Add service functionality
  const handleOpenAddModal = async (type) => {
    if (isParentView) return; 
    
    setAddServiceType(type);
    setAddForm({ serviceId: "", staffId: "" });
    
    // Start by showing the modal (this triggers the staff fetch via hooks)
    setIsAddModalOpen(true);

    try {
      const services = await offeringsService.getServicesByType(type);
      const interventionsFromAssessment =
        assessmentData?.backgroundHistory?.interventions || [];

      const savedServiceIds = [
        ...new Set(
          interventionsFromAssessment.map((i) => i.serviceId).filter(Boolean)
        ),
      ];

      const currentEnrolled = [
        ...(selectedStudent?.oneOnOneServices || []),
        ...(selectedStudent?.groupClassServices || [])
      ];

      const enrolledServiceIds = new Set(
        currentEnrolled.map((es) => es.serviceId)
      );

      const filteredServices = services.filter(
        (s) => savedServiceIds.includes(s.id) && !enrolledServiceIds.has(s.id)
      );

      if (filteredServices.length === 0) {
        // Keep empty array but warn user
        setAvailableServices([]);
        // Optional: you can alert here, or just show the message in the modal
        alert(
          "No services match the student's recorded interventions. Please review Step IV - Background History."
        );
      } else {
        setAvailableServices(filteredServices);
      }
    } catch (error) {
      alert("Error loading services: " + error.message);
    }
  };

  const handleAddSubmit = async () => {
    if (!addForm.serviceId || !addForm.staffId)
      return alert("Select service and staff.");
    setIsSubmitting(true);
    try {
      const serviceObj = availableServices.find(
        (s) => s.id === addForm.serviceId
      );
      const isTherapy = addServiceType === "Therapy";
      const staffList = isTherapy ? therapists : teachers;
      
      const staffObj = staffList?.find(
        (s) => (s.uid || s.id) === addForm.staffId
      );

      if (!staffObj) throw new Error("Staff member not found.");

      const assignData = {
        serviceId: serviceObj.id,
        serviceName: serviceObj.name,
        staffId: addForm.staffId,
        staffName: `${staffObj.firstName} ${staffObj.lastName}`,
        type: addServiceType,
        staffRole: isTherapy ? "therapist" : "teacher",
      };

      await childService.assignService(selectedStudent.id, assignData);
      await userService.addSpecialization(addForm.staffId, serviceObj.name);

      await refreshData();
      setIsAddModalOpen(false);
      alert("Service added and Staff updated!");
    } catch (err) {
      alert("Failed: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state is now handled inside the return with sidebar visible

  const calculateAge = (dob) => {
    if (!dob) return "N/A";
    const age = Math.abs(
      new Date(Date.now() - new Date(dob).getTime()).getUTCFullYear() - 1970
    );
    return isNaN(age) ? "N/A" : age;
  };

  const enrolled = [
    ...(selectedStudent?.enrolledServices || []),
    ...(selectedStudent?.oneOnOneServices || []),
    ...(selectedStudent?.groupClassServices || []),
  ];
  const therapyServices = enrolled.filter(
    (s) => s.serviceType === "Therapy" || s.staffRole === "therapist"
  );
  const groupServices = enrolled.filter(
    (s) => s.serviceType === "Class" || s.staffRole === "teacher"
  );

  const getQualifiedStaff = (serviceName, serviceType) => {
    if (!serviceName || !serviceType) return [];
    
    // If we are still loading, return empty to prevent errors
    if (loadingTeachers || loadingTherapists) return [];

    const staffList = serviceType === "Therapy" ? therapists : teachers;
    if (!staffList) return [];

    return staffList.filter((staff) =>
      staff.specializations?.some(
        (spec) => spec.trim().toLowerCase() === serviceName.trim().toLowerCase()
      )
    );
  };

  const effectiveFilteredStudents = isParentView
    ? filteredStudents.filter((s) => s.parentId === currentUser.uid)
    : filteredStudents;

  // Determine sidebar config based on user role
  const getSidebarConfigByRole = () => {
    if (isParentView) return getParentConfig();

    switch (currentUser?.role) {
      case 'therapist':
        return getTherapistConfig();
      case 'teacher':
        return getTeacherConfig();
      case 'super_admin':
        return getAdminConfig(true);
      case 'admin':
      default:
        return getAdminConfig(false);
    }
  };
  const sidebarConfig = getSidebarConfigByRole();

  const mainContent = (
    <div className="sp-main">
      <div className="sp-page">
        {/* === VIEW 1: LIST === */}
        {viewMode === "list" && (
          <>
            <div className="sp-header">
              <div className="sp-header-content">
                <div className="header-title">
                  <h1>{isParentView ? "MY CHILDREN" : "STUDENT PROFILES"}</h1>
                  <p className="header-subtitle">
                    {isParentView
                      ? "View your children's profiles and activities"
                      : "Manage enrolled students and view activities"
                    }
                  </p>
                </div>
                <div className="filter-actions">
                  <div className="search-wrapper">
                    <span className="search-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="M21 21l-4.35-4.35"/>
                      </svg>
                    </span>
                    <input
                      type="text"
                      className="sp-search"
                      placeholder="Search student name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="filter-wrapper">
                    <select
                      className="sp-filter-select"
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                    >
                      <option value="all">All Students</option>
                      <option value="therapy">Therapy Only</option>
                      <option value="group">Group Class Only</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="sp-content-area">
              <div className="sp-grid">
                {effectiveFilteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="sp-card"
                    onClick={() => handleSelectStudent(student)}
                  >
                    <div className="sp-card-image-box">
                      {student.photoUrl ? (
                        <img
                          src={student.photoUrl}
                          className="sp-photo"
                          alt=""
                        />
                      ) : (
                        <div className="sp-photo-placeholder">
                          {student.firstName[0]}
                        </div>
                      )}
                    </div>
                    <div className="sp-card-body">
                      <h3 className="sp-name">
                        {student.firstName} {student.lastName}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination Load More Button */}
              {!isParentView && hasMore && (
                <div className="sp-load-more-wrapper">
                  <button
                    className="sp-load-more-btn"
                    onClick={handleLoadMore}
                  >
                    Load More Students
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* === VIEW 2: PROFILE === */}
        {viewMode === "profile" && selectedStudent && (
          <div className="profile-wrapper">
            <div className="profile-top">
              <div className="left-group">
                <span className="back-arrow" onClick={handleBack}>
                  <svg width="32" height="52" viewBox="0 0 32 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M11.6255 22.8691C9.89159 24.4549 9.89159 27.1866 11.6255 28.7724L30.3211 45.8712C31.7604 47.1876 31.7604 49.455 30.3211 50.7714C29.0525 51.9316 27.1081 51.9316 25.8395 50.7714L1.01868 28.0705C0.366419 27.4738 0 26.6645 0 25.8208C0 24.977 0.366419 24.1678 1.01868 23.571L25.8395 0.87018C27.1081 -0.290054 29.0525 -0.290057 30.3211 0.870177C31.7604 2.1865 31.7604 4.45398 30.3211 5.7703L11.6255 22.8691Z" fill="#636363"/>
                  </svg>

                </span>
                <h2>
                  {isParentView 
                    ? `${selectedStudent.firstName}'S PROFILE` 
                    : "STUDENT PROFILE"
                  }
                </h2>
              </div>
            </div>

            <div className="profile-3col">
              <div className="profile-photo-frame">
                {selectedStudent.photoUrl ? (
                  <img
                    src={selectedStudent.photoUrl}
                    className="profile-photo"
                    alt="profile"
                  />
                ) : (
                  <div
                    className="profile-photo-placeholder">
                    {selectedStudent.firstName[0]}
                  </div>
                )}
              </div>

              <div className="profile-info">
                <h1 className="profile-fullname">
                  {selectedStudent.lastName}, {selectedStudent.firstName}
                </h1>
                <div className="profile-details">
                  <div className="profile-left">
                    <p>
                      <b>Nickname:</b>{" "}
                      {selectedStudent.nickname || "N/A"}
                    </p>
                    <p>
                      <b>Address:</b>{" "}
                      {selectedStudent.address || "N/A"}
                    </p>
                    <p>
                      <b>Date of Birth:</b>{" "}
                      {selectedStudent.dateOfBirth || "N/A"}
                    </p>
                    <p>
                      <b>Current Age:</b>{" "}
                      {calculateAge(selectedStudent.dateOfBirth) ?? "N/A"}
                    </p>
                  </div>

                  <div className="profile-right">
                    <p>
                      <b>Gender:</b>{" "}
                      {selectedStudent.gender || "N/A"}
                    </p>
                    <p>
                      <b>Current School:</b>{" "}
                      {selectedStudent.school || "N/A"}
                    </p>
                    <p>
                      <b>Relationship:</b>{" "}
                      {selectedStudent.relationshipToClient || "N/A"}
                    </p>
                  </div>
                </div>

                {parentData && (
                 <div className="guardian-section">

                    <p className="guardian-name">
                      <b>Guardian:</b> {parentData.firstName}{" "}
                      {parentData.lastName}
                    </p>
                    <div className="guardian-meta">

                      <span> {parentData.email}</span>
                      <span> {parentData.phone}</span>
                    </div>
                  </div>
                )}

                <div className="assessment-btn-wrapper">
                  <button
                    className={`see-more-btn assessment-btn ${
                      showAssessment ? "active" : "inactive"
                    }`}
                    onClick={() => setShowAssessment(!showAssessment)}
                  >
                    {showAssessment
                      ? "Hide Assessment History"
                      : "Assessment History"}
                  </button>
                </div>
              </div>
            </div>

            {showAssessment &&
              (isAssessmentLoading ? (
                <Loading variant="compact" message="Loading assessment" showBrand={false} />
              ) : (
                <AssessmentHistory
                  childData={selectedStudent}
                  assessmentData={assessmentData}
                />
              ))}

            <div className="profile-content-scroll">
              {/* New Service Enrollments Panel - uses new data model if available */}
              {selectedStudent?.serviceEnrollments?.length > 0 ? (
                <ServiceEnrollmentsPanel
                  childId={selectedStudent.id}
                  onServiceClick={handleServiceClick}
                  selectedService={selectedService}
                  isReadOnly={isParentView}
                  onAddService={!isParentView ? () => handleOpenAddModal("Therapy") : undefined}
                />
              ) : (
                /* Legacy UI - for students not yet migrated */
                <div className="services-split-row">
                  <div className="content-section">
                    <div className="services-header-row">
                      <h2 className="services-header">Therapy Services</h2>
                      {!isParentView && (
                        <button onClick={() => handleOpenAddModal("Therapy")}>
                          <b>+ Add</b>
                        </button>
                      )}
                    </div>
                    <div className="services-list">
                      {therapyServices.map((s, i) => (
                        <div key={i}>
                          <div
                            className={`service-row clickable ${
                              selectedService === s.serviceName ? "active" : ""
                            }`}
                            onClick={() => handleServiceClick(s.serviceName)}
                          >
                            <div className="service-left">🧠 {s.serviceName}</div>
                            <div>{s.staffName}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="content-section">
                    <div className="services-header-row">
                      <h2 className="services-header">Group Classes</h2>
                      {!isParentView && (
                        <button onClick={() => handleOpenAddModal("Class")}>
                          <b>+ Add</b>
                        </button>
                      )}
                    </div>
                    <div className="services-list">
                      {groupServices.map((s, i) => (
                        <div
                          key={i}
                          className={`service-row clickable ${
                            selectedService === s.serviceName ? "active" : ""
                          }`}
                          onClick={() => handleServiceClick(s.serviceName)}
                        >
                          <div className="service-left">👥 {s.serviceName}</div>
                          <div>{s.staffName}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedService && (
                <div ref={calendarRef}>
                  <ActivityCalendar
                    activities={studentActivities.filter(
                      (a) =>
                        a.serviceName === selectedService ||
                        a.serviceType === selectedService ||
                        a.className === selectedService
                    )}
                    // Pass empty array if staff not loaded; ActivityCalendar will use denormalized names
                    teachers={combinedStaff}
                    selectedServiceName={selectedService}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        <GeneralFooter pageLabel={isParentView ? "Child Profile" : "Student Profile"} />
      </div>
      
      {/* Admin-only Add Service Modal */}
      {!isParentView && isAddModalOpen && (
        <div className="add-service-overlay">
          <div className="add-service-modal">
            <h3>Enroll in {addServiceType}</h3>
            <div className="modal-form-body">
              {availableServices.length === 0 ? (
                <p className="modal-warning">
                  No services available for this student based on recorded
                  interventions. Please check Background History.
                </p>
              ) : null}
              <select
                className="modal-select"
                onChange={(e) =>
                  setAddForm({ ...addForm, serviceId: e.target.value })
                }
                value={addForm.serviceId}
              >
                <option value="">Select Service...</option>
                {availableServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <select
                className="modal-select spaced"
                onChange={(e) =>
                  setAddForm({ ...addForm, staffId: e.target.value })
                }
                value={addForm.staffId}
                disabled={!addForm.serviceId || loadingTeachers || loadingTherapists}
              >
                <option value="">
                  {(loadingTeachers || loadingTherapists) 
                    ? "Loading Staff..." 
                    : "Select Staff..."}
                </option>
                {getQualifiedStaff(
                  availableServices.find((s) => s.id === addForm.serviceId)
                    ?.name,
                  addServiceType
                ).map((t) => (
                  <option key={t.uid || t.id} value={t.uid || t.id}>
                    {t.firstName} {t.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn-confirm"
                disabled={isSubmitting || loadingTeachers || loadingTherapists}
                onClick={handleAddSubmit}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Handle container/sidebar wrapping
  if (noContainer) {
    return mainContent;
  }

  if (hideSidebar) {
    return <div className="sp-container">{mainContent}</div>;
  }

  // Determine forceActive based on role
  const getForceActive = () => {
    switch (currentUser?.role) {
      case 'therapist':
        return '/therapist/dashboard';
      case 'teacher':
        return '/teacher/dashboard';
      default:
        return '/admin/StudentProfile';
    }
  };

  return (
    <div className="sp-container">
      <Sidebar {...sidebarConfig} forceActive={getForceActive()} />
      {loading ? (
        <Loading role="admin" message="Loading students" variant="content" />
      ) : (
        mainContent
      )}
    </div>
  );
};

export default StudentProfile;