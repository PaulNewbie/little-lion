import { useState } from "react";
import AdminSidebar from "../../components/sidebar/AdminSidebar";
import "./css/ManageParents.css";

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

// --------------------------
// Component
// --------------------------
const ManageParents = () => {
  const [selectedParent, setSelectedParent] = useState(null);

  const handleBack = () => setSelectedParent(null);

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

      <div className="manageParentsPage">
        <header>
          <h1>
            {selectedParent
              ? `${selectedParent.firstName} ${selectedParent.lastName}'s Children`
              : "Parents Information"}
          </h1>
        </header>

        <main>
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
      </div>
    </div>
  );
};

export default ManageParents;
