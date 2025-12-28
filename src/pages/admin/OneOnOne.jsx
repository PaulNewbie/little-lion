import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query"; // ✅ Import React Query
import AdminSidebar from "../../components/sidebar/AdminSidebar";
import GeneralFooter from "../../components/footer/generalfooter";
import childService from "../../services/childService";
import offeringsService from "../../services/offeringsService"; // ✅ Use centralized service
import useManageTherapists from "../../hooks/useManageTherapists";
import { db } from "../../config/firebase";
import { collection, addDoc } from "firebase/firestore";
import "./css/OneOnOne.css";

const OneOnOne = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient(); // ✅ To refresh data after adding service
  const { therapists } = useManageTherapists();

  const [level, setLevel] = useState("services");
  const [selectedService, setSelectedService] = useState(null);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  
  // Form State
  const [newService, setNewService] = useState({
    name: "",
    description: "",
    type: "Therapy",
  });

  // 1. ✅ CACHED: Fetch Students (Instant if loaded in Dashboard)
  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['students'],
    queryFn: () => childService.getAllChildren(),
    staleTime: 1000 * 60 * 5,
  });

  // 2. ✅ CACHED: Fetch Services
  const { data: allServices = [], isLoading: loadingServices } = useQuery({
    queryKey: ['services'],
    queryFn: () => offeringsService.getAllServices(),
    staleTime: 1000 * 60 * 5,
  });

  // Derived state: Filter out 'Class' types for this page
  const services = allServices.filter((s) => s.type !== "Class");
  
  const loading = loadingStudents || loadingServices;

  // Check if coming back from StudentProfile
  useEffect(() => {
    if (location.state?.returnToService) {
      setSelectedService(location.state.returnToService);
      setLevel("students");
    }
  }, [location.state]);

  // Derived state: Filter students for the selected service
  const enrolledStudents = selectedService
    ? students.filter((s) => {
        const allServices = s.enrolledServices || [
          ...(s.therapyServices || []), 
          ...(s.services || [])
        ];
        // Robust check for service name match
        return allServices.some((srv) => 
          srv.serviceName?.trim().toLowerCase() === selectedService.name?.trim().toLowerCase()
        );
      })
    : [];

  /* ===============================
     HANDLERS
  =============================== */
  const handleSelectService = (service) => {
    setSelectedService(service);
    setLevel("students");
  };

  // ✅ OPTIMIZED: Navigate IMMEDIATELY. 
  // Don't fetch activities here. The StudentProfile page will fetch them using useQuery.
  const handleSelectStudent = (student) => {
    navigate("/admin/StudentProfile", {
      state: {
        student,
        // activities: [], // Remove this, let the Profile page fetch it
        therapists,
        selectedService,
        selectedServiceFromOneOnOne: selectedService,
        fromOneOnOne: true,
        scrollToCalendar: true,
      },
    });
  };

  const goBack = () => {
    if (level === "students") {
      setSelectedService(null);
      setLevel("services");
    }
  };

  const handleServiceInputChange = (e) => {
    const { name, value } = e.target;
    setNewService((prev) => ({ ...prev, [name]: value }));
  };

  const createService = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "services"), {
        ...newService,
        active: true,
        createdAt: new Date(),
      });

      // ✅ REFRESH: Tell React Query to fetch the new list
      queryClient.invalidateQueries({ queryKey: ['services'] });

      setShowAddServiceModal(false);
      setNewService({ name: "", description: "", type: "Therapy" });
      alert("Service added successfully!");
    } catch (err) {
      console.error("Error creating service:", err);
      alert("Failed to add service.");
    }
  };

  if (loading) return <div className="loading-container">Loading...</div>;

  /* ===============================
     RENDER (Same as before)
  =============================== */
  return (
    <div className="ooo-container">
      <AdminSidebar forceActive="/admin/one-on-one" />

      <div className="ooo-main">
        <div className="ooo-page">
          <div className="ooo-content">
            {level === "services" && (
              <>
                <div className="ooo-header">
                  <div className="ooo-title">
                    <h1>ONE-ON-ONE SERVICES</h1>
                    <p className="ooo-subtitle">
                      Manage parent accounts and student registration
                    </p>
                  </div>
                </div>

                <div className="ooo-grid">
                  <button
                    className="floating-add-btn"
                    onClick={() => setShowAddServiceModal(true)}
                  >
                    + ONE-ON-ONE SERVICE
                  </button>

                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="ooo-card"
                      onClick={() => handleSelectService(service)}
                    >
                      <div className="ooo-card-info">
                        <h3>{service.name}</h3>
                        {service.type && (
                          <small style={{ color: "#888" }}>({service.type})</small>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {level === "students" && selectedService && (
              <>
                <div className="ooo-header">
                  <span className="back-arrow" onClick={goBack}>
                    ‹
                  </span>
                  <h1 className="service-name">{selectedService.name}</h1>
                </div>

                <div className="ooo-grid">
                  {enrolledStudents.length === 0 ? (
                    <p style={{ color: "#888", fontStyle: "italic" }}>
                      No students enrolled for this service yet.
                    </p>
                  ) : (
                    enrolledStudents.map((student) => {
                      const serviceInfo = (student.enrolledServices || [
                        ...(student.therapyServices || []),
                        ...(student.services || []),
                      ]).find((s) => s.serviceName === selectedService.name);

                      return (
                        <div
                          key={student.id}
                          className="ooo-card"
                          onClick={() => handleSelectStudent(student)}
                        >
                          <div className="ooo-photo-area">
                            {student.photoUrl ? (
                              <img src={student.photoUrl} alt="" />
                            ) : (
                              <span>📷</span>
                            )}
                          </div>
                          <div className="ooo-card-info">
                            <p className="ooo-name">
                              {student.lastName}, {student.firstName}
                            </p>
                            <p className="ooo-sub">
                              Therapist:{" "}
                              {serviceInfo?.staffName || serviceInfo?.therapistName || "Not assigned"}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}

            {/* MODAL REMAINS THE SAME */}
            {showAddServiceModal && (
              <div
                className="modal-overlay"
                onClick={() => setShowAddServiceModal(false)}
              >
                <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                  <h2>Add New Service</h2>
                  <form onSubmit={createService} className="modal-form">
                    <input
                      name="name"
                      placeholder="Service Name"
                      value={newService.name}
                      onChange={handleServiceInputChange}
                      required
                    />
                    <textarea
                      name="description"
                      placeholder="Description"
                      value={newService.description}
                      onChange={handleServiceInputChange}
                    />
                    <div style={{ margin: "15px 0" }}>
                      <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                        Service Type:
                      </label>
                      <select
                        name="type"
                        value={newService.type}
                        onChange={handleServiceInputChange}
                        style={{ width: "100%", padding: "8px" }}
                      >
                        <option value="Therapy">Therapy</option>
                        <option value="Assessment">Assessment</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="modal-actions">
                      <button type="button" onClick={() => setShowAddServiceModal(false)}>
                        Cancel
                      </button>
                      <button type="submit">Add Service</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
          <GeneralFooter pageLabel="OneOnOne" />
        </div>
      </div>
    </div>
  );
};

export default OneOnOne;