import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";

// Auth Components
import LoginPage from "./pages/auth/LoginPage";
import ProtectedRoute from "./routes/ProtectedRoute";

// Admin Components
import OneOnOne from "./pages/admin/OneOnOne";
import PlayGroup from "./pages/admin/PlayGroup";
import EnrollChild from "./pages/admin/EnrollChild";
import ManageTeachers from "./pages/admin/ManageTeachers";
import ManageTherapists from "./pages/admin/ManageTherapists"; // Import New Component
import ManageParents from "./pages/admin/ManageParents.jsx";
import OtherServices from "./pages/admin/OtherServices";

// Teacher & Parent Components
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import PlayGroupActivity from "./pages/teacher/PlayGroupActivity";
import ParentDashboard from "./pages/parent/ParentDashboard";
import ChildActivities from "./pages/parent/ChildActivities";

// Common Components
import Loading from "./components/common/Loading";

const AppRoutes = () => {
  const { currentUser, loading } = useAuth();

  if (loading) return <Loading />;

  return (
    <Routes>
      <Route
        path="/login"
        element={
          currentUser ? (
            <Navigate
              to={
                currentUser.role === "admin"
                  ? "/admin/one-on-one"
                  : currentUser.role === "teacher"
                  ? "/teacher/dashboard"
                  : currentUser.role === "therapist"
                  ? "/therapist/dashboard" // Redirect therapist
                  : "/parent/dashboard"
              }
              replace
            />
          ) : (
            <LoginPage />
          )
        }
      />

      {/* ADMIN ROUTES */}
      <Route
        path="/admin/one-on-one"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <OneOnOne />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={<Navigate to="/admin/one-on-one" replace />}
      />
      <Route
        path="/admin/play-group"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <PlayGroup />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/enroll-child"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <EnrollChild />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/manage-teachers"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <ManageTeachers />
          </ProtectedRoute>
        }
      />

      {/* NEW: Manage Therapists Route */}
      <Route
        path="/admin/manage-therapists"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <ManageTherapists />
          </ProtectedRoute>
        }
      />

      {/*Manage Parent Accounts  */}
      <Route
        path="/admin/manage-parents"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <ManageParents />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/services"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <OtherServices />
          </ProtectedRoute>
        }
      />

      {/* TEACHER ROUTE */}
      <Route
        path="/teacher/dashboard"
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />

      {/* NEW: THERAPIST ROUTE - Reuses Teacher Dashboard */}
      <Route
        path="/therapist/dashboard"
        element={
          <ProtectedRoute allowedRoles={["therapist"]}>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />

      {/* SHARED: Play Group Upload (Allowed for Teacher, Admin, and Therapist) */}
      <Route
        path="/teacher/play-group-upload"
        element={
          <ProtectedRoute allowedRoles={["teacher", "admin", "therapist"]}>
            <PlayGroupActivity />
          </ProtectedRoute>
        }
      />

      {/* PARENT ROUTES */}
      <Route
        path="/parent/dashboard"
        element={
          <ProtectedRoute allowedRoles={["parent"]}>
            <ParentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/parent/child/:childId"
        element={
          <ProtectedRoute allowedRoles={["parent"]}>
            <ChildActivities />
          </ProtectedRoute>
        }
      />

      {/* Default Fallback */}
      <Route
        path="/"
        element={
          currentUser ? (
            <Navigate
              to={
                currentUser.role === "admin"
                  ? "/admin/one-on-one"
                  : currentUser.role === "teacher"
                  ? "/teacher/dashboard"
                  : currentUser.role === "therapist"
                  ? "/therapist/dashboard"
                  : "/parent/dashboard"
              }
              replace
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
