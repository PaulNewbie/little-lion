import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';

// Auth Components
import LoginPage from './pages/auth/LoginPage';
import ProtectedRoute from './routes/ProtectedRoute';

// Admin Components
import OneOnOne from './pages/admin/OneOnOne';
import PlayGroup from './pages/admin/PlayGroup';
import EnrollChild from './pages/admin/EnrollChild';
import ManageTeachers from './pages/admin/ManageTeachers';
import ManageTherapists from './pages/admin/ManageTherapists';
import OtherServices from './pages/admin/OtherServices';

// Teacher Components
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import PlayGroupActivity from './pages/teacher/PlayGroupActivity';

// Therapist Components
import TherapistDashboard from './pages/therapist/TherapistDashboard';
import TherapySessionForm from './pages/therapist/TherapySessionForm'; // Make sure this file exists

// Parent Components
import ParentDashboard from './pages/parent/ParentDashboard';
import ChildActivities from './pages/parent/ChildActivities';
import ParentInquiries from './pages/parent/ParentInquiries'; // IMPORTED
import NewInquiry from './pages/parent/NewInquiry';           // IMPORTED

// Staff Shared Components
import StaffInquiries from './components/common/StaffInquiries'; // IMPORTED

// Common Components
import Loading from './components/common/Loading';

const AppRoutes = () => {
  const { currentUser, loading } = useAuth();

  if (loading) return <Loading />;

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          currentUser ? (
            <Navigate to={
              currentUser.role === 'admin' ? '/admin/one-on-one' :
              currentUser.role === 'teacher' ? '/teacher/dashboard' :
              currentUser.role === 'therapist' ? '/therapist/dashboard' : 
              '/parent/dashboard'
            } replace />
          ) : (
            <LoginPage />
          )
        } 
      />

      {/* ADMIN ROUTES */}
      <Route path="/admin/one-on-one" element={<ProtectedRoute allowedRoles={['admin']}><OneOnOne /></ProtectedRoute>} />
      <Route path="/admin/dashboard" element={<Navigate to="/admin/one-on-one" replace />} />
      <Route path="/admin/play-group" element={<ProtectedRoute allowedRoles={['admin']}><PlayGroup /></ProtectedRoute>} />
      <Route path="/admin/enroll-child" element={<ProtectedRoute allowedRoles={['admin']}><EnrollChild /></ProtectedRoute>} />
      <Route path="/admin/manage-teachers" element={<ProtectedRoute allowedRoles={['admin']}><ManageTeachers /></ProtectedRoute>} />
      <Route path="/admin/manage-therapists" element={<ProtectedRoute allowedRoles={['admin']}><ManageTherapists /></ProtectedRoute>} />
      <Route path="/admin/services" element={<ProtectedRoute allowedRoles={['admin']}><OtherServices /></ProtectedRoute>} />

      {/* TEACHER ROUTES */}
      <Route path="/teacher/dashboard" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherDashboard /></ProtectedRoute>} />
      <Route path="/teacher/play-group-upload" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><PlayGroupActivity /></ProtectedRoute>} />

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

      {/* Default Fallback */}
      <Route
        path="/"
        element={
          currentUser ? (
            <Navigate to={
              currentUser.role === 'admin' ? '/admin/one-on-one' :
              currentUser.role === 'teacher' ? '/teacher/dashboard' :
              currentUser.role === 'therapist' ? '/therapist/dashboard' :
              '/parent/dashboard'
            } replace />
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