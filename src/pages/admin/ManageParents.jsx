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
          <h1>Parent Information</h1>
        </header>
        <main>
          <div className="parentsGrid">
            {parents.map((parent) => (
              <div key={parent.id} className="parentCard">
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
        </main>
      </div>
    </div>
  );
};

export default ManageParents;
