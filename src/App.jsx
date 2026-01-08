import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";

// For Caching
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Auth Components
import LandingPage from "./pages/auth/LandingPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import ChangePassword from "./pages/auth/ChangePassword";

// Admin Components
import OneOnOne from "./pages/admin/OneOnOne";
import PlayGroup from "./pages/admin/PlayGroup";
import ManageTeachers from "./pages/admin/ManageTeachers";
import ManageTherapists from "./pages/admin/ManageTherapists";
import EnrollStudent from "./pages/admin/enrollmentTabPages/EnrollStudent";
import ManageAdmins from "./pages/admin/ManageAdmins";
import StudentProfile from "./pages/admin/studentProfile/StudentProfile";

// Teacher Components
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import PlayGroupActivity from "./pages/teacher/PlayGroupActivity";

// Therapist Components
import TherapistDashboard from "./pages/therapist/TherapistDashboard";
import TherapySessionForm from "./pages/therapist/TherapySessionForm";
import TherapistProfile from "./pages/therapist/TherapistProfile";

// Parent Components
import ParentChildProfile from "./pages/parent/ParentChildProfile";
import ChildActivities from "./pages/parent/ChildActivities";
import ParentInquiries from "./pages/parent/ParentInquiries";
import NewInquiry from "./pages/parent/NewInquiry";

// Staff Shared Components
import StaffInquiries from "./pages/shared/StaffInquiries";

// Common Components
import Loading from "./components/common/Loading";

const AppRoutes = () => {
  const { currentUser, loading } = useAuth();

  if (loading) return <Loading />;

  const getHomeRoute = (role) => {
    switch (role) {
      case "super_admin":
      case "admin":
        return "/admin/StudentProfile";
      case "teacher":
        return "/teacher/dashboard";
      case "therapist":
        return "/therapist/dashboard";
      case "parent":
        return "/parent/dashboard";
      default:
        return "/login";
    }
  };

  return (
    <Routes>
      <Route path="/change-password" element={<ChangePassword />} />
      <Route
        path="/"
        element={
          currentUser ? (
            <Navigate to={getHomeRoute(currentUser.role)} replace />
          ) : (
            <LandingPage />
          )
        }
      />
      <Route
        path="/login"
        element={
          currentUser ? (
            <Navigate to={getHomeRoute(currentUser.role)} replace />
          ) : (
            <LandingPage />
          )
        }
      />

      {/* ADMIN ROUTES */}
      <Route
        path="/admin/StudentProfile"
        element={
          <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
            <StudentProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/one-on-one"
        element={
          <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
            <OneOnOne />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={<Navigate to="/admin/StudentProfile" replace />}
      />
      <Route
        path="/admin/play-group"
        element={
          <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
            <PlayGroup />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/manage-teachers"
        element={
          <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
            <ManageTeachers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/manage-therapists"
        element={
          <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
            <ManageTherapists />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/enrollment"
        element={
          <ProtectedRoute allowedRoles={["super_admin"]}>
            <EnrollStudent />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/manage-admins"
        element={
          <ProtectedRoute allowedRoles={["super_admin"]}>
            <ManageAdmins />
          </ProtectedRoute>
        }
      />

      {/* TEACHER ROUTES */}
      <Route
        path="/teacher/dashboard"
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/play-group-upload"
        element={
          <ProtectedRoute allowedRoles={["teacher", "admin", "super_admin"]}>
            <PlayGroupActivity />
          </ProtectedRoute>
        }
      />

      {/* THERAPIST ROUTES */}
      <Route
        path="/therapist/dashboard"
        element={
          <ProtectedRoute allowedRoles={["therapist"]}>
            <TherapistDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/therapist/session/:studentId"
        element={
          <ProtectedRoute allowedRoles={["therapist"]}>
            <TherapySessionForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/therapist/session-form"
        element={
          <ProtectedRoute role="therapist">
            <TherapySessionForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/therapist/profile"
        element={
          <ProtectedRoute allowedRoles={["therapist"]}>
            <TherapistProfile />
          </ProtectedRoute>
        }
      />

      {/* PARENT ROUTES */}
      <Route
        path="/parent/dashboard"
        element={
          <ProtectedRoute allowedRoles={["parent"]}>
            <ParentChildProfile />
          </ProtectedRoute>
        }
      />
      {/* NEW: Parent Child Profile Route */}
      <Route
        path="/parent/child-profile/:childId"
        element={
          <ProtectedRoute allowedRoles={["parent"]}>
            <ParentChildProfile />
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
      <Route
        path="/parent/inquiries"
        element={
          <ProtectedRoute allowedRoles={["parent"]}>
            <ParentInquiries />
          </ProtectedRoute>
        }
      />
      <Route
        path="/parent/inquiries/new"
        element={
          <ProtectedRoute allowedRoles={["parent"]}>
            <NewInquiry />
          </ProtectedRoute>
        }
      />

      {/* SHARED STAFF ROUTES (Inbox) */}
      <Route
        path="/staff/inquiries"
        element={
          <ProtectedRoute allowedRoles={["teacher", "therapist"]}>
            <StaffInquiries />
          </ProtectedRoute>
        }
      />

      {/* UNAUTHORIZED ROUTE */}
      <Route
        path="/unauthorized"
        element={
          <div
            style={{ padding: "50px", textAlign: "center", color: "#d32f2f" }}
          >
            <h1>⛔ Access Denied</h1>
            <p>You do not have permission to view this page.</p>
          </div>
        }
      />

      {/* Default Fallback */}
      <Route
        path="/"
        element={
          currentUser ? (
            <Navigate to={getHomeRoute(currentUser.role)} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// cache configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
