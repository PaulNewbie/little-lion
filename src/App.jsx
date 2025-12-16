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
import LoginPage from './pages/auth/LoginPage';
import ProtectedRoute from './routes/ProtectedRoute';
import ChangePassword from './pages/auth/ChangePassword';

// Admin Components
import OneOnOne from './pages/admin/OneOnOne';
import PlayGroup from './pages/admin/PlayGroup';
import EnrollChild from './pages/admin/EnrollChild';
import ManageTeachers from './pages/admin/ManageTeachers';
import ManageTherapists from './pages/admin/ManageTherapists';
import OtherServices from './pages/admin/OtherServices';
import ManageAdmins from './pages/admin/ManageAdmins';
import ManageParents from "./pages/admin/ManageParents.jsx";
import StudentProfile from './pages/admin/StudentProfile';


// Teacher Components
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import PlayGroupActivity from './pages/teacher/PlayGroupActivity';

// Therapist Components
import TherapistDashboard from './pages/therapist/TherapistDashboard';
import TherapySessionForm from './pages/therapist/TherapySessionForm'; 

// Parent Components
import ParentDashboard from './pages/parent/ParentDashboard';
import ChildActivities from './pages/parent/ChildActivities';
import ParentInquiries from './pages/parent/ParentInquiries'; 
import NewInquiry from './pages/parent/NewInquiry';           

// Staff Shared Components
import StaffInquiries from './components/common/StaffInquiries'; 

// Common Components
import Loading from "./components/common/Loading";

const AppRoutes = () => {
  const { currentUser, loading } = useAuth();

  if (loading) return <Loading />;

  // --- Helper to determine home page based on role ---
  const getHomeRoute = (role) => {
    switch (role) {
      case 'super_admin': 
      case 'admin':
        return '/admin/StudentProfile'; // Consistent with login redirect
      case 'teacher':
        return '/teacher/dashboard';
      case 'therapist':
        return '/therapist/dashboard';
      case 'parent':
        return '/parent/dashboard';
      default:
        return '/login';
    }
  };

  return (
    <Routes>
      <Route path="/change-password" element={<ChangePassword />} />
      <Route
        path="/login"
        element={
          currentUser ? (
            <Navigate
              to={
                // FIX 1: Add check for super_admin here
                (currentUser.role === "admin" || currentUser.role === "super_admin")
                  ? "/admin/StudentProfile"
                  : currentUser.role === "teacher"
                  ? "/teacher/dashboard"
                  : currentUser.role === "therapist"
                  ? "/therapist/dashboard"
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
      {/* 1. Shared Admin Routes (Accessible by admin AND super_admin) */}
      
      {/* FIX 2: Added 'super_admin' to allowedRoles for StudentProfile */}
      <Route path="/admin/StudentProfile" element={ <ProtectedRoute allowedRoles={['admin', 'super_admin']}><StudentProfile /></ProtectedRoute>}/>
      
      <Route path="/admin/one-on-one" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><OneOnOne /></ProtectedRoute>} />
      <Route path="/admin/dashboard" element={<Navigate to="/admin/StudentProfile" replace />} />
      <Route path="/admin/play-group" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><PlayGroup /></ProtectedRoute>} />
      <Route path="/admin/enroll-child" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><EnrollChild /></ProtectedRoute>} />
      <Route path="/admin/manage-teachers" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><ManageTeachers /></ProtectedRoute>} />
      <Route path="/admin/manage-therapists" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><ManageTherapists /></ProtectedRoute>} />
      
      {/* Note: Check if you want super_admin to access ManageParents as well. Assuming yes, added it here. */}
      <Route path="/admin/manage-parents" element={ <ProtectedRoute allowedRoles={["admin", "super_admin"]}><ManageParents /></ProtectedRoute>}/>

      {/* 2. SUPER ADMIN ONLY ROUTES */}
      <Route path="/admin/services" element={<ProtectedRoute allowedRoles={['super_admin']}><OtherServices /></ProtectedRoute>} />
      <Route path="/admin/manage-admins" element={<ProtectedRoute allowedRoles={['super_admin']}><ManageAdmins /></ProtectedRoute>} />

      {/* TEACHER ROUTES */}
      <Route path="/teacher/dashboard" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherDashboard /></ProtectedRoute>} />
      <Route path="/teacher/play-group-upload" element={<ProtectedRoute allowedRoles={['teacher', 'admin', 'super_admin']}><PlayGroupActivity /></ProtectedRoute>} />

      {/* THERAPIST ROUTES */}
      <Route path="/therapist/dashboard" element={<ProtectedRoute allowedRoles={['therapist']}><TherapistDashboard /></ProtectedRoute>} />
      <Route path="/therapist/session/:studentId" element={<ProtectedRoute allowedRoles={['therapist']}><TherapySessionForm /></ProtectedRoute>} />

      {/* PARENT ROUTES */}
      <Route path="/parent/dashboard" element={<ProtectedRoute allowedRoles={['parent']}><ParentDashboard /></ProtectedRoute>} />
      <Route path="/parent/child/:childId" element={<ProtectedRoute allowedRoles={['parent']}><ChildActivities /></ProtectedRoute>} />
      <Route path="/parent/inquiries" element={<ProtectedRoute allowedRoles={['parent']}><ParentInquiries /></ProtectedRoute>} />
      <Route path="/parent/inquiries/new" element={<ProtectedRoute allowedRoles={['parent']}><NewInquiry /></ProtectedRoute>} />

      {/* SHARED STAFF ROUTES (Inbox) */}
      <Route path="/staff/inquiries" element={<ProtectedRoute allowedRoles={['teacher', 'therapist']}><StaffInquiries /></ProtectedRoute>} />

      {/* UNAUTHORIZED ROUTE */}
      <Route path="/unauthorized" element={
        <div style={{ padding: '50px', textAlign: 'center', color: '#d32f2f' }}>
          <h1>⛔ Access Denied</h1>
          <p>You do not have permission to view this page.</p>
        </div>
      } />

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