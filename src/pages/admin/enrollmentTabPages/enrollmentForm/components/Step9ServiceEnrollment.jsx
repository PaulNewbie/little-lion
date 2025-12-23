import React, { useState, useEffect } from "react";
import readUsers from "../../enrollmentDatabase/readUsers";
import readServices from "../../enrollmentDatabase/readServices";

export default function Step9Enrollment({ data, onChange }) {
  const [services, setServices] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);

  const [oneOnOneServices, setOneOnOneServices] = useState([]);
  const [groupClassServices, setGroupClassServices] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch all services from DB
        const allDbServices = await readServices.getAllServices();

        // 2. Get the names of interventions saved in Step 4
        const savedInterventions = data.backgroundHistory?.interventions || [];
        const savedNames = savedInterventions.map((item) => item.name);

        // 3. Filter services to only show what was saved in Step 4
        const filtered = allDbServices.filter((service) =>
          savedNames.includes(service.name)
        );
        setServices(filtered);

        // 4. Fetch Staff - CORRECTED: Now gets users with proper role and specializations
        const allStaff = await readUsers.getAllTeachersTherapists();

        // Separate by role
        const teachersList = allStaff.filter((u) => u.role === "teacher");
        const therapistsList = allStaff.filter((u) => u.role === "therapist");

        setTeachers(teachersList);
        setTherapists(therapistsList);

        console.log("Teachers loaded:", teachersList);
        console.log("Therapists loaded:", therapistsList);
      } catch (error) {
        console.error("Error loading step 9:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    if (data.oneOnOneServices) setOneOnOneServices(data.oneOnOneServices);
    if (data.groupClassServices) setGroupClassServices(data.groupClassServices);
  }, [data.backgroundHistory?.interventions]);

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

    console.log("Service selected:", service.name);
    console.log("Qualified staff found:", qualified);

    const list =
      category === "oneOnOne" ? oneOnOneServices : groupClassServices;
    const updated = list.map((s, i) =>
      i === index
        ? {
            serviceId: service.id,
            serviceName: service.name,
            serviceType: service.type, // "Therapy" or "Class"
            staffId: qualified?.uid || "",
            staffName: qualified
              ? `${qualified.firstName} ${qualified.lastName}`
              : "",
            // We'll add staffRole in manageChildren based on serviceType
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

    console.log("Staff changed to:", staff);

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

    // CORRECTED: Filter staff who have this service in their specializations
    const qualified = staffList.filter((staff) =>
      staff.specializations?.includes(serviceName)
    );

    console.log(`Qualified staff for ${serviceName}:`, qualified);
    return qualified;
  };

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

  const renderRows = (list, category) => {
    const allowedType = category === "oneOnOne" ? "Therapy" : "Class";

    return (
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
              style={{ alignItems: "center" }}
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
                  <option value="">-- Select {allowedType} --</option>
                  {services
                    .filter((s) => s.type === allowedType)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
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
                    {allowedType === "Therapy" ? "Therapist" : "Teacher"} --
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
                    ⚠️ No qualified staff available for {service.serviceName}
                  </small>
                )}
              </div>

              <button
                type="button"
                className="remove-entry-btn"
                onClick={() => handleRemoveService(category, index)}
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

  if (loading) {
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
        style={{ color: "#64748b", marginBottom: "20px", fontSize: "0.95rem" }}
      >
        Assign services and their respective teachers or therapists to this
        student.
      </p>

      {/* Debug Info - Remove in production */}
      {process.env.NODE_ENV === "development" && (
        <div
          style={{
            background: "#f0f9ff",
            padding: "10px",
            marginBottom: "20px",
            borderRadius: "6px",
            fontSize: "12px",
          }}
        >
          <strong>Debug Info:</strong>
          <br />
          Teachers loaded: {teachers.length} | Therapists loaded:{" "}
          {therapists.length}
          <br />
          Services available: {services.map((s) => s.name).join(", ")}
        </div>
      )}

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
