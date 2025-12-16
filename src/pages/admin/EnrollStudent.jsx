// THIS FILE IS WRITTEN  BY FIDEL FOR ENROLLMENT PAGE, YES IT IS ANOTHER FILE, and DIFFERENT syntax from enrollchil.jsx, but with same intent of enrolling a student.
import AdminSidebar from "../../components/sidebar/AdminSidebar";
import "./css/EnrollStudent.css";
import { useState } from "react";

// --------------------------
// Parent Data
// --------------------------
const parents = [
  { id: 1, firstName: "Juan", lastName: "Dela Cruz" },
  { id: 2, firstName: "Maria", lastName: "Santos" },
  { id: 3, firstName: "Pedro", lastName: "Reyes" },
  { id: 4, firstName: "Ana", lastName: "Lopez" },
  { id: 5, firstName: "Luis", lastName: "Garcia" },
  { id: 6, firstName: "Clara", lastName: "Torres" },
];

// --------------------------
// Student Data
// --------------------------
const students = [
  { id: 1, parentId: 1, firstName: "Mark", lastName: "Dela Cruz" },
  { id: 2, parentId: 2, firstName: "Liza", lastName: "Santos" },
  { id: 3, parentId: 1, firstName: "Tony", lastName: "Dela Cruz" },
  { id: 4, parentId: 3, firstName: "Ella", lastName: "Reyes" },
];

export default function EnrollStudent() {
  const [selectedParent, setSelectedParent] = useState(null);
  const [showParentForm, setShowParentForm] = useState(false);
  const [parentForm, setParentForm] = useState({
    email: "",
    password: "",
  });
  const handleBack = () => setSelectedParent(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setParentForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateParent = (e) => {
    e.preventDefault();
    console.log("New Parent Account:", parentForm);

    // reset & close
    setParentForm({ email: "", password: "" });
    setShowParentForm(false);
  };

  //just to know how many child has
  const selectedParentChildren = selectedParent
    ? students.filter((s) => s.parentId === selectedParent.id)
    : [];

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        maxHeight: "100vh",
        overflow: "hidden",
      }}
    >
      <AdminSidebar />

      <div className="student-enrollment-page">
        <div className="header">
          <h1>STUDENT ENROLLMENT</h1>

          <div className="search-wrapper">
            <input
              type="text"
              className="search"
              placeholder="SEARCH NAME..."
            />
            <span className="search-icon">🔍</span>
          </div>
        </div>

        <main>
          <h2>
            {" "}
            {!selectedParent
              ? "Parents Accounts"
              : selectedParentChildren > 1
              ? "Parent's Children"
              : "Parent's Child"}
          </h2>
          {!selectedParent ? (
            <div className="parentsGrid">
              {parents.map((parent) => (
                <div
                  key={parent.id}
                  className="parentCard"
                  onClick={() => setSelectedParent(parent)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="photoArea">
                    <span className="photoEmoji">👤</span>
                    {parent.photoUrl && (
                      <img src={parent.photoUrl} alt={parent.firstName} />
                    )}
                  </div>
                  <div className="parentCardInfoCon">
                    <p className="parentName">
                      {parent.lastName}, {parent.firstName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <button onClick={handleBack} style={{ marginBottom: "20px" }}>
                ← Back to Parents
              </button>
              <ul>
                {students
                  .filter((s) => s.parentId === selectedParent.id)
                  .map((student) => (
                    <li key={student.id}>
                      {student.lastName}, {student.firstName}
                    </li>
                  ))}
              </ul>
              {students.filter((s) => s.parentId === selectedParent.id)
                .length === 0 && <p>No students found for this parent.</p>}
            </div>
          )}
        </main>

        <button
          className="addParentAccBtn"
          onClick={() => {
            setShowParentForm(true);
          }}
        >
          +
        </button>

        {/* Create Parent Modal */}
        {showParentForm && (
          <div className="modalOverlay">
            <div className="modal">
              <h2>Create Parent Account</h2>

              <form onSubmit={handleCreateParent}>
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={parentForm.email}
                  onChange={handleInputChange}
                  required
                />

                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={parentForm.password}
                  onChange={handleInputChange}
                  required
                />

                <div className="modalActions">
                  <button
                    type="button"
                    onClick={() => setShowParentForm(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit">Create</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
