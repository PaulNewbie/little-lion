import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';

// Auth Components
import LoginPage from './pages/auth/LoginPage';
import ProtectedRoute from './routes/ProtectedRoute';

// Admin Components
import OneOnOne from './pages/admin/OneOnOne'; // NEW Main View
import PlayGroup from './pages/admin/PlayGroup';
import EnrollChild from './pages/admin/EnrollChild';
import ManageTeachers from './pages/admin/ManageTeachers';
import OtherServices from './pages/admin/OtherServices';

// Teacher & Parent Components
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import ParentDashboard from './pages/parent/ParentDashboard';

// Common Components
import Loading from './components/common/Loading';

const AppRoutes = () => {
  const { currentUser, loading } = useAuth();

  if (loading) return <Loading />;

  return (
    <Routes>
      {/* Public Route */}
      <Route 
        path="/login" 
        element={
          currentUser ? (
            <Navigate to={
              currentUser.role === 'admin' ? '/admin/one-on-one' :
              currentUser.role === 'teacher' ? '/teacher/dashboard' :
              '/parent/dashboard'
            } replace />
          ) : (
            <LoginPage />
          )
        } 
      />

      {/* --- ADMIN ROUTES --- */}
      
      {/* 1. Main 1:1 View */}
      <Route
        path="/admin/one-on-one"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <OneOnOne />
          </ProtectedRoute>
        }
      />

      {/* 2. Redirect /dashboard to /one-on-one */}
      <Route
        path="/admin/dashboard"
        element={<Navigate to="/admin/one-on-one" replace />}
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

      {/* --- OTHER ROLES --- */}
      <Route
        path="/teacher/dashboard"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/parent/dashboard"
        element={
          <ProtectedRoute allowedRoles={['parent']}>
            <ParentDashboard />
          </ProtectedRoute>
        }
      />

      {/* Default Fallback */}
      <Route
        path="/"
        element={
          currentUser ? (
            <Navigate to={
              currentUser.role === 'admin' ? '/admin/one-on-one' :
              currentUser.role === 'teacher' ? '/teacher/dashboard' :
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