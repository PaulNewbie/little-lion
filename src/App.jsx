import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';

// Auth Components
import LoginPage from './pages/auth/LoginPage';
import ProtectedRoute from './routes/ProtectedRoute';

// Admin Components
import AdminDashboard from './pages/admin/AdminDashboard';
import OneOnOne from './pages/admin/OneOnOne';
import PlayGroup from './pages/admin/PlayGroup';
import EnrollChild from './pages/admin/EnrollChild';
import ManageTeachers from './pages/admin/ManageTeachers';
import OtherServices from './pages/admin/OtherServices';

// Teacher Components
import TeacherDashboard from './pages/teacher/TeacherDashboard';

// Parent Components
import ParentDashboard from './pages/parent/ParentDashboard';

// Common Components
import Loading from './components/common/Loading';

const AppRoutes = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={
          currentUser ? (
            <Navigate to={`/${currentUser.role}/dashboard`} replace />
          ) : (
            <LoginPage />
          )
        } 
      />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/one-on-one"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <OneOnOne />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/play-group"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <PlayGroup />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/enroll-child"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <EnrollChild />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/manage-teachers"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ManageTeachers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/services"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <OtherServices />
          </ProtectedRoute>
        }
      />

      {/* Teacher Routes */}
      <Route
        path="/teacher/dashboard"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />

      {/* Parent Routes */}
      <Route
        path="/parent/dashboard"
        element={
          <ProtectedRoute allowedRoles={['parent']}>
            <ParentDashboard />
          </ProtectedRoute>
        }
      />

      {/* Default Route */}
      <Route
        path="/"
        element={
          currentUser ? (
            <Navigate to={`/${currentUser.role}/dashboard`} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* 404 Route */}
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