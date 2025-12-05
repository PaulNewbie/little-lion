import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';

// Auth Components
import LoginPage from './components/auth/LoginPage';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Admin Components (REMOVE curly braces here because they use 'export default')
import AdminDashboard from './components/admin/AdminDashboard';
import OneOnOne from './components/admin/OneOnOne';
import PlayGroup from './components/admin/PlayGroup';
import EnrollChild from './components/admin/EnrollChild';
import OtherServices from './components/admin/OtherServices';

// Teacher Components
import TeacherDashboard from './components/teacher/TeacherDashboard';

// Parent Components
import ParentDashboard from './components/parent/ParentDashboard';

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