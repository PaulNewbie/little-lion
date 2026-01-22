import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import userService from "../../../../../services/userService";
import offeringsService from "../../../../../services/offeringsService";
import {
  generateEnrollmentId,
  SERVICE_ENROLLMENT_STATUS,
} from "../../../../../utils/constants";

export default function Step9Enrollment({ data, onChange, currentUserId, errors = {} }) {
  // Single state for all service enrollments (new unified model)
  const [serviceEnrollments, setServiceEnrollments] = useState(
    data.serviceEnrollments || []
  );

  // 1. CACHED: Fetch All Services (Only fetches once globally)
  const { data: allDbServices = [] } = useQuery({
    queryKey: ["services"],
    queryFn: () => offeringsService.getAllServices(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // 2. CACHED: Fetch All Staff (Only fetches once globally)
  const { data: allStaff = [], isLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: () => userService.getAllStaff(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // --- Derived Data (Filters instantly without useEffect) ---
  // Filter services to only show the ones selected in Step 4
  const interventions = data.backgroundHistory?.interventions || [];
  const services = allDbServices.filter((service) => {
    const savedServiceIds = interventions.map((i) => i.serviceId);
    return savedServiceIds.includes(service.id);
  });

  const teachers = allStaff.filter((u) => u.role === "teacher");
  const therapists = allStaff.filter((u) => u.role === "therapist");

  // Helper to get frequency from Step 4 interventions
  const getFrequencyForService = (serviceId) => {
    const intervention = interventions.find((i) => i.serviceId === serviceId);
    return intervention?.frequency || null;
  };

  // --- Handlers (New Unified Model) ---

  const handleAddService = (serviceType) => {
    // Create a placeholder enrollment (not fully populated until service is selected)
    const newEnrollment = {
      _tempId: Date.now(), // Temporary ID for React key until service is selected
      serviceId: "",
      serviceName: "",
      serviceType: serviceType, // "Therapy" or "Class"
      staffId: "",
      staffName: "",
      staffRole: "",
    };
    const updated = [...serviceEnrollments, newEnrollment];
    setServiceEnrollments(updated);
    onChange("serviceEnrollments", updated);
  };

  const handleRemoveService = (index) => {
    const updated = serviceEnrollments.filter((_, i) => i !== index);
    setServiceEnrollments(updated);
    onChange("serviceEnrollments", updated);
  };

  // Handle service selection - creates full enrollment structure
  const handleServiceChange = (index, serviceId) => {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return;

    const isTherapy = service.type === "Therapy";
    const staffList = isTherapy ? therapists : teachers;

    // Auto-select qualified staff if available
    const qualified = staffList.find((staff) =>
      staff.specializations?.some(
        (spec) =>
          spec.trim().toLowerCase() === service.name.trim().toLowerCase()
      )
    );

    const now = new Date().toISOString();
    const updated = serviceEnrollments.map((enrollment, i) =>
      i === index
        ? {
            // Full enrollment structure
            enrollmentId: generateEnrollmentId(),
            serviceId: service.id,
            serviceName: service.name,
            serviceType: service.type,
            status: SERVICE_ENROLLMENT_STATUS.ACTIVE,
            // Staff info (will be completed when staff is selected)
            staffId: qualified?.uid || "",
            staffName: qualified
              ? `${qualified.firstName} ${qualified.lastName}`
              : "",
            staffRole: qualified?.role || (isTherapy ? "therapist" : "teacher"),
            // Enrollment metadata
            enrolledAt: now,
            statusChangedAt: now,
            statusChangeReason: null,
            frequency: getFrequencyForService(service.id),
            notes: null,
            lastActivityDate: null,
          }
        : enrollment
    );

    setServiceEnrollments(updated);
    onChange("serviceEnrollments", updated);
  };

  const handleStaffChange = (index, staffId) => {
    const enrollment = serviceEnrollments[index];
    const isTherapy = enrollment.serviceType === "Therapy";
    const staffList = isTherapy ? therapists : teachers;
    const staff = staffList.find((s) => s.uid === staffId);

    const updated = serviceEnrollments.map((e, i) =>
      i === index
        ? {
            ...e,
            staffId: staff?.uid || "",
            staffName: staff ? `${staff.firstName} ${staff.lastName}` : "",
            staffRole: staff?.role || "",
          }
        : e
    );

    setServiceEnrollments(updated);
    onChange("serviceEnrollments", updated);
  };

  // Get qualified staff for a service
  const getQualifiedStaff = (serviceName, serviceType) => {
    if (!serviceName || !serviceType) return [];
    const staffList = serviceType === "Therapy" ? therapists : teachers;

    return staffList.filter((staff) =>
      staff.specializations?.some(
        (spec) => spec.trim().toLowerCase() === serviceName.trim().toLowerCase()
      )
    );
  };

  // --- Styles ---
  const selectStyles = {
    width: "100%",
    padding: "10px 35px 10px 12px",
    fontSize: "0.95rem",
    fontFamily: "inherit",
    color: "#1e293b",
    backgroundColor: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    outline: "none",
    cursor: "pointer",
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
  };
  const selectDisabledStyles = {
    ...selectStyles,
    backgroundColor: "#f1f5f9",
    color: "#94a3b8",
    cursor: "not-allowed",
    opacity: 0.6,
  };
  const selectErrorStyles = {
    ...selectStyles,
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
  };
  const selectSuccessStyles = { ...selectStyles, borderColor: "#10b981" };

  // Get used service IDs by type (to prevent duplicates)
  const getUsedServiceIdsByType = (serviceType) => {
    return serviceEnrollments
      .filter((e) => e.serviceType === serviceType && e.serviceId)
      .map((e) => e.serviceId);
  };

  // Filter enrollments by service type for rendering
  const therapyEnrollments = serviceEnrollments
    .map((e, idx) => ({ ...e, originalIndex: idx }))
    .filter((e) => e.serviceType === "Therapy");

  const classEnrollments = serviceEnrollments
    .map((e, idx) => ({ ...e, originalIndex: idx }))
    .filter((e) => e.serviceType === "Class");

  // Count available services by type
  const availableTherapyServices = services.filter((s) => s.type === "Therapy");
  const availableClassServices = services.filter((s) => s.type === "Class");

  // Check if can add more services
  const canAddTherapy = therapyEnrollments.length < availableTherapyServices.length;
  const canAddClass = classEnrollments.length < availableClassServices.length;

  const renderRows = (enrollmentList, serviceType) => {
    const label = serviceType === "Therapy" ? "Therapy" : "Class";
    const staffLabel = serviceType === "Therapy" ? "Therapist" : "Teacher";

    return (
      <>
        {enrollmentList.length > 0 && (
          <div className="assessment-tools-header">
            <label>Service</label>
            <label>Assigned Staff</label>
          </div>
        )}
        {enrollmentList.map((enrollment) => {
          const qualifiedStaff = getQualifiedStaff(
            enrollment.serviceName,
            enrollment.serviceType
          );
          const hasError = enrollment.serviceId && qualifiedStaff.length === 0;

          return (
            <div
              className="assessment-tool-row"
              key={enrollment.enrollmentId || enrollment._tempId || enrollment.originalIndex}
              style={{ alignItems: "center" }}
            >
              <div className="assessment-tool-field">
                <select
                  value={enrollment.serviceId}
                  onChange={(e) =>
                    handleServiceChange(enrollment.originalIndex, e.target.value)
                  }
                  style={
                    enrollment.serviceId && !hasError
                      ? selectSuccessStyles
                      : selectStyles
                  }
                >
                  <option value="">-- Select {label} --</option>
                  {services
                    .filter((s) => {
                      if (s.type !== serviceType) return false;

                      const usedServiceIds = getUsedServiceIdsByType(serviceType);

                      // Allow currently selected service
                      if (s.id === enrollment.serviceId) return true;

                      // Eliminate already chosen services
                      return !usedServiceIds.includes(s.id);
                    })
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="assessment-tool-field">
                <select
                  value={enrollment.staffId}
                  onChange={(e) =>
                    handleStaffChange(enrollment.originalIndex, e.target.value)
                  }
                  disabled={!enrollment.serviceId}
                  style={
                    !enrollment.serviceId
                      ? selectDisabledStyles
                      : hasError
                      ? selectErrorStyles
                      : enrollment.staffId
                      ? selectSuccessStyles
                      : selectStyles
                  }
                >
                  <option value="">-- Select {staffLabel} --</option>
                  {qualifiedStaff.map((staff) => (
                    <option key={staff.uid} value={staff.uid}>
                      {staff.firstName} {staff.lastName}
                    </option>
                  ))}
                </select>
                {hasError && (
                  <small
                    style={{
                      color: "#ef4444",
                      fontSize: "0.75rem",
                      marginTop: "5px",
                      display: "block",
                    }}
                  >
                    No qualified staff available for {enrollment.serviceName}
                  </small>
                )}
              </div>

              <button
                type="button"
                className="remove-entry-btn"
                onClick={() => handleRemoveService(enrollment.originalIndex)}
                style={{ marginTop: "0px" }}
              >
                ✕
              </button>
            </div>
          );
        })}
      </>
    );
  };

  // 3. Simple Loading State
  if (isLoading) {
    return (
      <div className="form-section">
        <p style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
          Loading staff and services...
        </p>
      </div>
    );
  }

  return (
    <div className="form-section">
      <h3>IX. ENROLLMENT</h3>
      <p
        style={{ color: "#64748b", marginBottom: "15px", fontSize: "0.95rem" }}
      >
        Assign services and their respective teachers or therapists to this
        student.
      </p>

      {/* Info about where options come from */}
      <div
        style={{
          background: "#f0f9ff",
          padding: "12px 16px",
          marginBottom: "20px",
          borderRadius: "8px",
          fontSize: "0.875rem",
          color: "#0369a1",
          borderLeft: "4px solid #0ea5e9",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <span>
          The service options below are based on the <strong>interventions</strong> you selected in Step 7 (Diagnosis & Interventions).
          {services.length === 0 && (
            <span style={{ color: "#dc2626", marginLeft: "5px" }}>
              No interventions found. Please go back to Step 7 and add interventions first.
            </span>
          )}
        </span>
      </div>

      {errors.serviceEnrollments && (
        <div className="field-error-message" style={{ marginBottom: '20px' }}>
          {errors.serviceEnrollments}
        </div>
      )}

      <div style={{ marginBottom: "30px" }}>
        <h4
          style={{ fontSize: "1rem", color: "#334155", marginBottom: "15px" }}
        >
          1 ON 1 SERVICE
        </h4>
        {renderRows(therapyEnrollments, "Therapy")}
        <button
          type="button"
          className="add-point-btn"
          onClick={() => handleAddService("Therapy")}
          disabled={!canAddTherapy}
          style={!canAddTherapy ? { opacity: 0.5, cursor: "not-allowed" } : {}}
        >
          + Add 1 on 1 Service
          {availableTherapyServices.length > 0 && (
            <span style={{ marginLeft: "8px", fontSize: "0.8rem", opacity: 0.7 }}>
              ({therapyEnrollments.length}/{availableTherapyServices.length})
            </span>
          )}
        </button>
      </div>

      <hr
        style={{
          border: "0",
          borderTop: "1px solid #e2e8f0",
          margin: "30px 0",
        }}
      />

      <div style={{ marginBottom: "30px" }}>
        <h4
          style={{ fontSize: "1rem", color: "#334155", marginBottom: "15px" }}
        >
          GROUP CLASS
        </h4>
        {renderRows(classEnrollments, "Class")}
        <button
          type="button"
          className="add-point-btn"
          onClick={() => handleAddService("Class")}
          disabled={!canAddClass}
          style={!canAddClass ? { opacity: 0.5, cursor: "not-allowed" } : {}}
        >
          + Add Group Class
          {availableClassServices.length > 0 && (
            <span style={{ marginLeft: "8px", fontSize: "0.8rem", opacity: 0.7 }}>
              ({classEnrollments.length}/{availableClassServices.length})
            </span>
          )}
        </button>
      </div>

      {therapyEnrollments.length === 0 && classEnrollments.length === 0 && (
        <div
          style={{
            padding: "40px 30px",
            textAlign: "center",
            color: "#94a3b8",
            backgroundColor: "#f8fafc",
            borderRadius: "8px",
            border: "2px dashed #e2e8f0",
          }}
        >
          <div>No services assigned yet.</div>
        </div>
      )}
    </div>
  );
}
