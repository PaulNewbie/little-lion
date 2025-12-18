import React, { useState, useEffect } from "react";

export default function Step9ServiceEnrollment({ data, onChange }) {
  const [services, setServices] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);

  // Mock data - Replace with actual API calls
  useEffect(() => {
    // Fetch services, teachers, therapists from your backend
    // For now, using mock data
    setServices([
      { id: "1", name: "Speech Therapy", type: "Therapy" },
      { id: "2", name: "Occupational Therapy", type: "Therapy" },
      { id: "3", name: "Behavioral Management", type: "Class" },
      { id: "4", name: "SPED One-on-One", type: "Class" },
    ]);

    setTeachers([
      {
        uid: "t1",
        firstName: "John",
        lastName: "Doe",
        specializations: ["Behavioral Management", "SPED One-on-One"],
      },
      {
        uid: "t2",
        firstName: "Jane",
        lastName: "Smith",
        specializations: ["SPED One-on-One"],
      },
    ]);

    setTherapists([
      {
        uid: "th1",
        firstName: "Dr. Maria",
        lastName: "Garcia",
        specializations: ["Speech Therapy"],
      },
      {
        uid: "th2",
        firstName: "Dr. Robert",
        lastName: "Lee",
        specializations: ["Occupational Therapy", "Speech Therapy"],
      },
    ]);

    // Initialize with existing data if any
    if (data.assignedServices) {
      setSelectedServices(data.assignedServices);
    }
  }, [data.assignedServices]);

  const handleToggleService = (service) => {
    const exists = selectedServices.find((s) => s.serviceId === service.id);

    if (exists) {
      // Remove service
      const updated = selectedServices.filter(
        (s) => s.serviceId !== service.id
      );
      setSelectedServices(updated);
      onChange("assignedServices", updated);
    } else {
      // Add service with auto-assigned staff
      const isTherapy = service.type === "Therapy";
      const staffList = isTherapy ? therapists : teachers;
      const qualified = staffList.find((staff) =>
        staff.specializations?.includes(service.name)
      );

      const newService = {
        serviceId: service.id,
        serviceName: service.name,
        serviceType: service.type,
        staffId: qualified?.uid || "",
        staffName: qualified
          ? `${qualified.firstName} ${qualified.lastName}`
          : "",
      };

      const updated = [...selectedServices, newService];
      setSelectedServices(updated);
      onChange("assignedServices", updated);
    }
  };

  const handleStaffChange = (serviceId, staffId) => {
    const service = selectedServices.find((s) => s.serviceId === serviceId);
    const isTherapy = service.serviceType === "Therapy";
    const staffList = isTherapy ? therapists : teachers;
    const staff = staffList.find((s) => s.uid === staffId);

    const updated = selectedServices.map((s) =>
      s.serviceId === serviceId
        ? {
            ...s,
            staffId: staff?.uid || "",
            staffName: staff ? `${staff.firstName} ${staff.lastName}` : "",
          }
        : s
    );

    setSelectedServices(updated);
    onChange("assignedServices", updated);
  };

  const getQualifiedStaff = (serviceName, serviceType) => {
    const staffList = serviceType === "Therapy" ? therapists : teachers;
    return staffList.filter((staff) =>
      staff.specializations?.includes(serviceName)
    );
  };

  return (
    <div className="form-section">
      <h3>IX. SERVICE ENROLLMENT</h3>
      <p style={{ color: "#64748b", marginBottom: "20px" }}>
        Select services for this student and assign qualified staff members.
      </p>

      {/* Available Services */}
      <div className="service-selection-container">
        <h4 style={{ marginBottom: "15px", color: "#334155" }}>
          Available Services
        </h4>

        <div className="services-grid">
          {services.map((service) => {
            const isSelected = selectedServices.some(
              (s) => s.serviceId === service.id
            );

            return (
              <div
                key={service.id}
                className={`service-card ${isSelected ? "selected" : ""}`}
                onClick={() => handleToggleService(service)}
                style={{
                  padding: "15px",
                  border: isSelected
                    ? "2px solid #3b82f6"
                    : "2px solid #e2e8f0",
                  borderRadius: "8px",
                  cursor: "pointer",
                  backgroundColor: isSelected ? "#eff6ff" : "#fff",
                  transition: "all 0.2s",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    style={{ width: "18px", height: "18px" }}
                  />
                  <div>
                    <div style={{ fontWeight: "600", color: "#1e293b" }}>
                      {service.name}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                      {service.type}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Services with Staff Assignment */}
      {selectedServices.length > 0 && (
        <div
          className="assigned-services-container"
          style={{ marginTop: "30px" }}
        >
          <h4 style={{ marginBottom: "15px", color: "#334155" }}>
            Assigned Services & Staff
          </h4>

          <div className="assigned-services-list">
            {selectedServices.map((service, index) => {
              const qualifiedStaff = getQualifiedStaff(
                service.serviceName,
                service.serviceType
              );

              return (
                <div
                  key={service.serviceId}
                  className="assigned-service-row"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "15px",
                    padding: "15px",
                    backgroundColor: "#f8fafc",
                    borderRadius: "8px",
                    marginBottom: "10px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "600", color: "#1e293b" }}>
                      {service.serviceName}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                      {service.serviceType}
                    </div>
                  </div>

                  <div style={{ flex: 2 }}>
                    <label
                      style={{
                        fontSize: "0.85rem",
                        color: "#64748b",
                        display: "block",
                        marginBottom: "5px",
                      }}
                    >
                      Assign{" "}
                      {service.serviceType === "Therapy"
                        ? "Therapist"
                        : "Teacher"}
                    </label>
                    <select
                      value={service.staffId}
                      onChange={(e) =>
                        handleStaffChange(service.serviceId, e.target.value)
                      }
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                      }}
                    >
                      <option value="">
                        Select{" "}
                        {service.serviceType === "Therapy"
                          ? "Therapist"
                          : "Teacher"}
                      </option>
                      {qualifiedStaff.map((staff) => (
                        <option key={staff.uid} value={staff.uid}>
                          {staff.firstName} {staff.lastName}
                        </option>
                      ))}
                    </select>

                    {qualifiedStaff.length === 0 && (
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "#ef4444",
                          marginTop: "5px",
                        }}
                      >
                        ⚠️ No qualified staff available for this service
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    className="remove-entry-btn"
                    onClick={() =>
                      handleToggleService({
                        id: service.serviceId,
                        name: service.serviceName,
                        type: service.serviceType,
                      })
                    }
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#fee2e2",
                      color: "#dc2626",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedServices.length === 0 && (
        <div
          style={{
            padding: "30px",
            textAlign: "center",
            color: "#94a3b8",
            backgroundColor: "#f8fafc",
            borderRadius: "8px",
            marginTop: "20px",
          }}
        >
          No services selected yet. Please select at least one service above.
        </div>
      )}
    </div>
  );
}
