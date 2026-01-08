import React, { useState, useRef, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import ParentSidebar from "../../components/sidebar/ParentSidebar";
import GeneralFooter from "../../components/footer/generalfooter";
import childService from "../../services/childService";
import activityService from "../../services/activityService";
import userService from "../../services/userService";
import assessmentService from "../../services/assessmentService";
import AssessmentHistory from "../shared/AssessmentHistory";
import ActivityCalendar from "../admin/studentProfile/components/ActivityCalendar";
import Loading from "../../components/common/Loading";
import TherapistCard from "../shared/TherapistCard";
import "../admin/studentProfile/StudentProfile.css";

const ParentChildProfile = () => {
  const { childId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // State
  const [child, setChild] = useState(location.state?.child || null);
  const [loading, setLoading] = useState(!location.state?.child);
  const [activities, setActivities] = useState([]);
  const [parentData, setParentData] = useState(null);
  const [assessmentData, setAssessmentData] = useState(null);
  const [isAssessmentLoading, setIsAssessmentLoading] = useState(false);

  // UI State
  const [selectedService, setSelectedService] = useState("");
  const [showAssessment, setShowAssessment] = useState(false);
  const calendarRef = useRef(null);

  // Combined staff for the calendar
  const [combinedStaff, setCombinedStaff] = useState([]);

  // Fetch child data if not passed via location.state
  useEffect(() => {
    const fetchChildData = async () => {
      if (!child && childId) {
        try {
          setLoading(true);
          const childData = await childService.getChildrenByParentId(currentUser.uid);
          const foundChild = childData.find(c => c.id === childId);
          
          if (!foundChild) {
            alert("Child not found or access denied");
            navigate("/parent/dashboard");
            return;
          }
          
          setChild(foundChild);
        } catch (error) {
          console.error("Error fetching child:", error);
          alert("Failed to load child data");
          navigate("/parent/dashboard");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchChildData();
  }, [child, childId, currentUser, navigate]);

  // Fetch activities when child is loaded
  useEffect(() => {
    const fetchActivities = async () => {
      if (child?.id) {
        try {
          const acts = await activityService.getActivitiesByChild(child.id);
          setActivities(acts);
        } catch (error) {
          console.error("Error fetching activities:", error);
        }
      }
    };

    fetchActivities();
  }, [child]);

  // Fetch parent data
  useEffect(() => {
    const fetchParent = async () => {
      if (child?.parentId) {
        try {
          const pData = await userService.getUserById(child.parentId);
          setParentData(pData);
        } catch (error) {
          console.error("Error fetching parent:", error);
        }
      }
    };

    fetchParent();
  }, [child]);

  // Fetch assessment data
  useEffect(() => {
    const fetchAssessment = async () => {
      if (child?.assessmentId && showAssessment) {
        try {
          setIsAssessmentLoading(true);
          const aData = await assessmentService.getAssessment(child.assessmentId);
          setAssessmentData(aData);
        } catch (error) {
          console.error("Error fetching assessment:", error);
        } finally {
          setIsAssessmentLoading(false);
        }
      }
    };

    fetchAssessment();
  }, [child, showAssessment]);

  // Fetch all staff for calendar
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const staff = await userService.getAllStaff();
        setCombinedStaff(staff);
      } catch (error) {
        console.error("Error fetching staff:", error);
      }
    };

    fetchStaff();
  }, []);

  const calculateAge = (dob) => {
    if (!dob) return "N/A";
    const age = Math.abs(
      new Date(Date.now() - new Date(dob).getTime()).getUTCFullYear() - 1970
    );
    return isNaN(age) ? "N/A" : age;
  };

  const handleBack = () => {
    navigate("/parent/dashboard");
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

  if (loading) return <Loading />;
  if (!child) return <div>Child not found</div>;

  const enrolled = child.enrolledServices || [];
  const therapyServices = enrolled.filter(s => s.type === "Therapy" || s.staffRole === "therapist");
  const groupServices = enrolled.filter(s => s.type === "Class" || s.staffRole === "teacher");

  return (
    <div className="sp-container">
      <ParentSidebar />
      <div className="sp-main">
        <div className="sp-page">
          <div className="profile-wrapper">
            <div className="profile-top">
              <div className="left-group">
                <span className="back-arrow" onClick={handleBack}>
                  ‹
                </span>
                <h2>{child.firstName}'S PROFILE</h2>
              </div>
            </div>

            <div className="profile-3col">
              <div className="profile-photo-frame">
                {child.photoUrl ? (
                  <img
                    src={child.photoUrl}
                    className="profile-photo"
                    alt="profile"
                  />
                ) : (
                  <div
                    className="profile-photo-placeholder"
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "3rem",
                      background: "#eee",
                    }}
                  >
                    {child.firstName[0]}
                  </div>
                )}
              </div>

              <div className="profile-info">
                <h1 className="profile-fullname">
                  {child.lastName}, {child.firstName}
                </h1>
                <div className="profile-details">
                  <div className="profile-left">
                    <p>
                      <span className="icon">🧒</span> <b>Nickname:</b>{" "}
                      {child.nickname || "N/A"}
                    </p>
                    <p>
                      <span className="icon">🏠</span> <b>Address:</b>{" "}
                      {child.address || "N/A"}
                    </p>
                    <p>
                      <span className="icon">🎂</span> <b>Date of Birth:</b>{" "}
                      {child.dateOfBirth || "N/A"}
                    </p>
                    <p>
                      <span className="icon">📅</span> <b>Current Age:</b>{" "}
                      {calculateAge(child.dateOfBirth) ?? "N/A"}
                    </p>
                  </div>

                  <div className="profile-right">
                    <p>
                      <span className="icon">🚻</span> <b>Gender:</b>{" "}
                      {child.gender || "N/A"}
                    </p>
                    <p>
                      <span className="icon">🏫</span> <b>School:</b>{" "}
                      {child.school || "N/A"}
                    </p>
                    <p>
                      <span className="icon">👨‍👩‍👧</span> <b>Relationship to Guardian:</b>{" "}
                      {child.relationshipToClient || "N/A"}
                    </p>
                  </div>
                </div>

                {parentData && (
                  <div
                    style={{
                      marginTop: "15px",
                      paddingTop: "15px",
                      borderTop: "1px solid #eee",
                      fontSize: "0.95rem",
                    }}
                  >
                    <p style={{ marginBottom: "5px" }}>
                      <span style={{ fontSize: "1.1em" }}>👪</span>{" "}
                      <b>Guardian:</b> {parentData.firstName}{" "}
                      {parentData.lastName}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        gap: "15px",
                        flexWrap: "wrap",
                        color: "#555",
                      }}
                    >
                      <span>📧 {parentData.email}</span>
                      <span>📞 {parentData.phone}</span>
                    </div>
                  </div>
                )}

                <div style={{ marginTop: "20px" }}>
                  <button
                    className="see-more-btn"
                    style={{
                      padding: "10px 20px",
                      background: showAssessment ? "#e0e0e0" : "#4a90e2",
                      color: showAssessment ? "#333" : "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                    onClick={() => setShowAssessment(!showAssessment)}
                  >
                    {showAssessment
                      ? "Hide Assessment History"
                      : "See Assessment History"}
                  </button>
                </div>
              </div>
            </div>

            {showAssessment &&
              (isAssessmentLoading ? (
                <Loading />
              ) : (
                <AssessmentHistory
                  childData={child}
                  assessmentData={assessmentData}
                />
              ))}

            <div
              className="profile-content-scroll"
              style={{ marginTop: "30px" }}
            >
              <div className="services-split-row">
                <div className="content-section">
                  <h2 className="services-header">Therapy Services</h2>
                  <div className="services-list">
                    {therapyServices.length > 0 ? (
                      therapyServices.map((s, i) => (
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
                          {/* Show Therapist Card Below */}
                          <TherapistCard
                            therapistId={s.staffId}
                            serviceName={s.serviceName}
                          />
                        </div>
                      ))
                    ) : (
                      <p style={{ color: "#aaa", fontStyle: "italic" }}>
                        No therapy services assigned
                      </p>
                    )}
                  </div>
                </div>

                <div className="content-section">
                  <h2 className="services-header">Group Classes</h2>
                  <div className="services-list">
                    {groupServices.length > 0 ? (
                      groupServices.map((s, i) => (
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
                      ))
                    ) : (
                      <p style={{ color: "#aaa", fontStyle: "italic" }}>
                        No group classes assigned
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {selectedService && (
                <div ref={calendarRef}>
                  <ActivityCalendar
                    activities={activities.filter(
                      (a) =>
                        a.serviceName === selectedService ||
                        a.serviceType === selectedService ||
                        a.className === selectedService
                    )}
                    teachers={combinedStaff}
                    selectedServiceName={selectedService}
                  />
                </div>
              )}
            </div>
          </div>

          <GeneralFooter pageLabel="Child Profile" />
        </div>
      </div>
    </div>
  );
};

export default ParentChildProfile;
