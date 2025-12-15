import AdminSidebar from "../../components/sidebar/AdminSidebar";
import "./css/ManageParents.css";

// --------------------------
// Student Data
// --------------------------
const students = [
  {
    id: 1,
    firstName: "Juan",
    lastName: "Dela Cruz",
  },
  {
    id: 2,
    firstName: "Maria",
    lastName: "Santos",
  },
  {
    id: 3,
    firstName: "Pedro",
    lastName: "Reyes",
  },
  {
    id: 4,
    firstName: "Ana",
    lastName: "Lopez",
  },
];

// --------------------------
// Component
// --------------------------
const ManageParents = () => {
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
          <h1>Parents Information</h1>
        </header>

        <div className="studentsGrid">
          {students.map((student) => (
            <div key={student.id} className="studentCard">
              <div className="photoArea">
                <span className="photoEmoji">👤</span>
                {student.photoUrl && (
                  <img src={student.photoUrl} alt={student.firstName} />
                )}
              </div>

              <p className="studentName">
                {student.lastName}, {student.firstName}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManageParents;
