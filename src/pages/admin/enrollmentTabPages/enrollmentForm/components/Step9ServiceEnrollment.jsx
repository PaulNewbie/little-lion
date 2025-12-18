import React, { useState, useEffect } from "react";

export default function Step9Enrollment({ data, onChange }) {
  const [services, setServices] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [therapists, setTherapists] = useState([]);

  // State split into two parts
  const [oneOnOneServices, setOneOnOneServices] = useState([]);
  const [groupClassServices, setGroupClassServices] = useState([]);

  useEffect(() => {
    // Mock data - Replace with actual API calls
    setServices([
      { id: "1", name: "Speech Therapy", type: "Therapy" },
      { id: "2", name: "Occupational Therapy", type: "Therapy" },
      { id: "3", name: "Physical Therapy", type: "Therapy" },
      { id: "4", name: "Behavioral Management", type: "Class" },
      { id: "5", name: "SPED One-on-One", type: "Class" },
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
      {
        uid: "th3",
        firstName: "Dr. Sarah",
        lastName: "Johnson",
        specializations: ["Physical Therapy"],
      },
    ]);

    if (data.oneOnOneServices) setOneOnOneServices(data.oneOnOneServices);
    if (data.groupClassServices) setGroupClassServices(data.groupClassServices);
  }, [data.oneOnOneServices, data.groupClassServices]);

  // Generic handlers updated to accept "category" (oneOnOne vs groupClass)
  const handleAddService = (category) => {
    const newService = {
      serviceId: "",
      serviceName: "",
      serviceType: "",
      staffId: "",
      staffName: "",
    };
    if (category === "oneOnOne") {
      const updated = [...oneOnOneServices, newService];
      setOneOnOneServices(updated);
      onChange("oneOnOneServices", updated);
    } else {
      const updated = [...groupClassServices, newService];
      setGroupClassServices(updated);
      onChange("groupClassServices", updated);
    }
  };

  const handleRemoveService = (category, index) => {
    const list =
      category === "oneOnOne" ? oneOnOneServices : groupClassServices;
    const updated = list.filter((_, i) => i !== index);

    if (category === "oneOnOne") {
      setOneOnOneServices(updated);
      onChange("oneOnOneServices", updated);
    } else {
      setGroupClassServices(updated);
      onChange("groupClassServices", updated);
    }
  };

  const handleServiceChange = (category, index, serviceId) => {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return;

    const isTherapy = service.type === "Therapy";
    const staffList = isTherapy ? therapists : teachers;
    const qualified = staffList.find((staff) =>
      staff.specializations?.includes(service.name)
    );

    const list =
      category === "oneOnOne" ? oneOnOneServices : groupClassServices;
    const updated = list.map((s, i) =>
      i === index
        ? {
            serviceId: service.id,
            serviceName: service.name,
            serviceType: service.type,
            staffId: qualified?.uid || "",
            staffName: qualified
              ? `${qualified.firstName} ${qualified.lastName}`
              : "",
          }
        : s
    );

    if (category === "oneOnOne") {
      setOneOnOneServices(updated);
      onChange("oneOnOneServices", updated);
    } else {
      setGroupClassServices(updated);
      onChange("groupClassServices", updated);
    }
  };

  const handleStaffChange = (category, index, staffId) => {
    const list =
      category === "oneOnOne" ? oneOnOneServices : groupClassServices;
    const service = list[index];
    const isTherapy = service.serviceType === "Therapy";
    const staffList = isTherapy ? therapists : teachers;
    const staff = staffList.find((s) => s.uid === staffId);

    const updated = list.map((s, i) =>
      i === index
        ? {
            ...s,
            staffId: staff?.uid || "",
            staffName: staff ? `${staff.firstName} ${staff.lastName}` : "",
          }
        : s
    );

    if (category === "oneOnOne") {
      setOneOnOneServices(updated);
      onChange("oneOnOneServices", updated);
    } else {
      setGroupClassServices(updated);
      onChange("groupClassServices", updated);
    }
  };

  const getQualifiedStaff = (serviceName, serviceType) => {
    if (!serviceName || !serviceType) return [];
    const staffList = serviceType === "Therapy" ? therapists : teachers;
    return staffList.filter((staff) =>
      staff.specializations?.includes(serviceName)
    );
  };

  // Styles from your original code
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

  // Helper to render the table rows to avoid code duplication
  const renderRows = (list, category) => (
    <>
      {list.length > 0 && (
        <div className="assessment-tools-header">
          <label>Service</label>
          <label>Assigned Staff</label>
        </div>
      )}
      {list.map((service, index) => {
        const qualifiedStaff = getQualifiedStaff(
          service.serviceName,
          service.serviceType
        );
        const hasError = service.serviceId && qualifiedStaff.length === 0;
        return (
          <div
            className="assessment-tool-row"
            key={`${category}-${index}`}
            style={{
              alignItems: "center",
            }}
          >
            <div className="assessment-tool-field">
              <select
                value={service.serviceId}
                onChange={(e) =>
                  handleServiceChange(category, index, e.target.value)
                }
                style={
                  service.serviceId && !hasError
                    ? selectSuccessStyles
                    : selectStyles
                }
              >
                <option value="">-- Select Service --</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.type})
                  </option>
                ))}
              </select>
            </div>
            <div className="assessment-tool-field">
              <select
                value={service.staffId}
                onChange={(e) =>
                  handleStaffChange(category, index, e.target.value)
                }
                disabled={!service.serviceId}
                style={
                  !service.serviceId
                    ? selectDisabledStyles
                    : hasError
                    ? selectErrorStyles
                    : service.staffId
                    ? selectSuccessStyles
                    : selectStyles
                }
              >
                <option value="">
                  -- Select{" "}
                  {service.serviceType === "Therapy" ? "Therapist" : "Teacher"}{" "}
                  --
                </option>
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
                  ⚠️ No qualified staff available
                </small>
              )}
            </div>
            <button
              type="button"
              className="remove-entry-btn"
              onClick={() => handleRemoveService(category, index)}
            >
              ✕
            </button>
          </div>
        );
      })}
    </>
  );

  return (
    <div className="form-section">
      <h3>IX. ENROLLMENT</h3>
      <p
        style={{ color: "#64748b", marginBottom: "20px", fontSize: "0.95rem" }}
      >
        Assign services and their respective teachers or therapists to this
        student.
      </p>

      {/* SECTION 1: 1 ON 1 SERVICE */}
      <div style={{ marginBottom: "30px" }}>
        <h4
          style={{ fontSize: "1rem", color: "#334155", marginBottom: "15px" }}
        >
          1 ON 1 SERVICE
        </h4>
        {renderRows(oneOnOneServices, "oneOnOne")}
        <button
          type="button"
          className="add-point-btn"
          onClick={() => handleAddService("oneOnOne")}
        >
          + Add 1 on 1 Service
        </button>
      </div>

      <hr
        style={{
          border: "0",
          borderTop: "1px solid #e2e8f0",
          margin: "30px 0",
        }}
      />

      {/* SECTION 2: GROUP CLASS */}
      <div style={{ marginBottom: "30px" }}>
        <h4
          style={{ fontSize: "1rem", color: "#334155", marginBottom: "15px" }}
        >
          GROUP CLASS
        </h4>
        {renderRows(groupClassServices, "groupClass")}
        <button
          type="button"
          className="add-point-btn"
          onClick={() => handleAddService("groupClass")}
        >
          + Add Group Class
        </button>
      </div>

      {oneOnOneServices.length === 0 && groupClassServices.length === 0 && (
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
          <div style={{ fontSize: "3rem", marginBottom: "10px", opacity: 0.5 }}>
            📋
          </div>
          <div>No services assigned yet.</div>
        </div>
      )}
    </div>
  );
}
