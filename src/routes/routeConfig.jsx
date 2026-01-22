// src/routes/routeConfig.jsx

import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { QueryClient } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";

// Auth Components
import LandingPage from "../pages/auth/LandingPage";
import ChangePassword from "../pages/auth/ChangePassword";
import ActivatePage from "../pages/auth/ActivatePage";
import AdminActivatePage from "../pages/auth/AdminActivatePage";

// Admin Components
import OneOnOne from "../pages/admin/OneOnOne";
import PlayGroup from "../pages/admin/PlayGroup";
import ManageTeachers from "../pages/admin/ManageTeachers";
import ManageTherapists from "../pages/admin/ManageTherapists";
import EnrollStudent from "../pages/admin/enrollmentTabPages/EnrollStudent";
import Concerns from "../pages/admin/Concerns";
import ManageAdmins from "../pages/admin/ManageAdmins";
import StudentProfile from "../pages/admin/studentProfile/StudentProfile";
import PendingAccounts from "../pages/admin/PendingAccounts";
import UserAccessManagement from "../pages/admin/UserAccessManagement";
import CleanupOldStudents from "../pages/admin/utils/CleanupOldStudents";

// Teacher Components
import TeacherDashboard from "../pages/teacher/TeacherDashboard";
import PlayGroupActivity from "../pages/teacher/PlayGroupActivity";
import TeacherProfile from "../pages/teacher/TeacherProfile";

// Therapist Components
import TherapistDashboard from "../pages/therapist/TherapistDashboard";
import TherapySessionForm from "../pages/therapist/TherapySessionForm";
import TherapistProfile from "../pages/therapist/TherapistProfile";

// Parent Components
import ParentDashboard from "../pages/parent/ParentChildProfile";
import ChildActivities from "../pages/parent/ChildActivities";
import ParentConcerns from "../pages/parent/parentConcernsPages/ParentConcerns";
import MonthlySummary from "../pages/parent/MonthlySummary";

// Common Components
import Loading from "../components/common/Loading";

import { hasPermission } from '../utils/permissions';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Route path constants
 */
export const ROUTES = {
  LOGIN: "/login",
  CHANGE_PASSWORD: "/change-password",
  UNAUTHORIZED: "/unauthorized",
  
  // NEW: Activation routes (public)
  ACTIVATE: "/activate",
  ADMIN_ACTIVATE: "/admin-activate",

  ADMIN: {
    DASHBOARD: "/admin/dashboard",
    STUDENT_PROFILE: "/admin/StudentProfile",
    ONE_ON_ONE: "/admin/one-on-one",
    PLAY_GROUP: "/admin/play-group",
    MANAGE_TEACHERS: "/admin/manage-teachers",
    MANAGE_THERAPISTS: "/admin/manage-therapists",
    ENROLLMENT: "/admin/enrollment",
    CONCERNS: "/admin/concerns",
    MANAGE_ADMINS: "/admin/manage-admins",
    PENDING_ACCOUNTS: "/admin/pending-accounts",
    USER_ACCESS: "/admin/user-access",
    CLEANUP_STUDENTS: "/admin/cleanup-students",
  },

  TEACHER: {
    DASHBOARD: "/teacher/dashboard",
    PROFILE: "/teacher/profile",
    PLAY_GROUP_UPLOAD: "/teacher/play-group-upload",
    ENROLLMENT: "/teacher/enrollment",
  },

  THERAPIST: {
    DASHBOARD: "/therapist/dashboard",
    SESSION: "/therapist/session/:studentId",
    SESSION_FORM: "/therapist/session-form",
    PROFILE: "/therapist/profile",
    ENROLLMENT: "/therapist/enrollment",
  },

  PARENT: {
    DASHBOARD: "/parent/dashboard",
    CHILD: "/parent/child/:childId",
    CONCERNS: "/parent/concerns",
    SUMMARY: "/parent/summary",
  },

};

/**
 * User role constants
 */
export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  TEACHER: "teacher",
  THERAPIST: "therapist",
  PARENT: "parent",
};

/**
 * Role groups for route protection
 */
export const ROLE_GROUPS = {
  ADMINS: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  STAFF: [ROLES.TEACHER, ROLES.THERAPIST],
  ALL_STAFF: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.TEACHER, ROLES.THERAPIST],
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get home route based on user role
 */
export const getHomeRoute = (role) => {
  switch (role) {
    case ROLES.SUPER_ADMIN:
    case ROLES.ADMIN:
      return ROUTES.ADMIN.STUDENT_PROFILE;
    case ROLES.TEACHER:
      return ROUTES.TEACHER.DASHBOARD;
    case ROLES.THERAPIST:
      return ROUTES.THERAPIST.DASHBOARD;
    case ROLES.PARENT:
      return ROUTES.PARENT.DASHBOARD;
    default:
      return ROUTES.LOGIN;
  }
};

/**
 * Get redirect path for authenticated user
 */
export const getAuthRedirectPath = (user) => {
  if (!user) return ROUTES.LOGIN;
  return getHomeRoute(user.role);
};

// =============================================================================
// QUERY CLIENT CONFIGURATION
// =============================================================================

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Unauthorized page component
 */
const UnauthorizedPage = () => (
  <div style={{ padding: "50px", textAlign: "center", color: "#d32f2f" }}>
    <h1>⛔ Access Denied</h1>
    <p>You do not have permission to view this page.</p>
  </div>
);

/**
 * Auth redirect component
 */
const AuthRedirect = ({ children }) => {
  const { currentUser } = useAuth();
  if (currentUser) {
    return <Navigate to={getAuthRedirectPath(currentUser)} replace />;
  }
  return children;
};

/**
 * Protected route component
 */
export const ProtectedRoute = ({ children, allowedRoles, requiredPermission }) => {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  // Check for pending activation
  if (currentUser.accountStatus === 'pending_setup') {
    return <Navigate to={ROUTES.ACTIVATE} replace />;
  }

  // Legacy: Check for mustChangePassword
  if (currentUser.mustChangePassword && location.pathname !== ROUTES.CHANGE_PASSWORD) {
    return <Navigate to={ROUTES.CHANGE_PASSWORD} replace />;
  }

  // Role check
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  }

  // Permission check (new)
  if (requiredPermission && !hasPermission(currentUser, requiredPermission)) {
    return <Navigate to={getHomeRoute(currentUser.role)} replace state={{ 
      permissionDenied: true,
      requiredPermission 
    }} />;
  }

  return children;
};

/**
 * Main AppRoutes component
 */
export const AppRoutes = () => {
  const { loading } = useAuth();

  if (loading) return <Loading message="Initializing" showProgress />;

  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path={ROUTES.CHANGE_PASSWORD} element={<ChangePassword />} />
      <Route path="/" element={<AuthRedirect><LandingPage /></AuthRedirect>} />
      <Route path={ROUTES.LOGIN} element={<AuthRedirect><LandingPage /></AuthRedirect>} />
      
      {/* NEW: Activation Routes (Public - no auth required) */}
      <Route path={ROUTES.ACTIVATE} element={<ActivatePage />} />
      <Route path={ROUTES.ADMIN_ACTIVATE} element={<AdminActivatePage />} />

      {/* ADMIN ROUTES */}
      <Route path={ROUTES.ADMIN.DASHBOARD} element={<Navigate to={ROUTES.ADMIN.STUDENT_PROFILE} replace />} />
      <Route path={ROUTES.ADMIN.STUDENT_PROFILE} element={<ProtectedRoute allowedRoles={ROLE_GROUPS.ALL_STAFF}><StudentProfile /></ProtectedRoute>} />
      <Route path={ROUTES.ADMIN.ONE_ON_ONE} element={<ProtectedRoute allowedRoles={ROLE_GROUPS.ADMINS}><OneOnOne /></ProtectedRoute>} />
      <Route path={ROUTES.ADMIN.PLAY_GROUP} element={<ProtectedRoute allowedRoles={ROLE_GROUPS.ADMINS}><PlayGroup /></ProtectedRoute>} />
      <Route path={ROUTES.ADMIN.MANAGE_TEACHERS} element={<ProtectedRoute allowedRoles={ROLE_GROUPS.ADMINS}><ManageTeachers /></ProtectedRoute>} />
      <Route path={ROUTES.ADMIN.MANAGE_THERAPISTS} element={<ProtectedRoute allowedRoles={ROLE_GROUPS.ADMINS}><ManageTherapists /></ProtectedRoute>} />
      <Route path={ROUTES.ADMIN.ENROLLMENT} element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.TEACHER, ROLES.THERAPIST]}><EnrollStudent /></ProtectedRoute>} />
      <Route path={ROUTES.ADMIN.CONCERNS} element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}><Concerns /></ProtectedRoute>} />
      <Route path={ROUTES.ADMIN.MANAGE_ADMINS} element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}><ManageAdmins /></ProtectedRoute>} />
      <Route path={ROUTES.ADMIN.PENDING_ACCOUNTS} element={<ProtectedRoute allowedRoles={ROLE_GROUPS.ADMINS}><PendingAccounts /></ProtectedRoute>} />
      <Route path={ROUTES.ADMIN.USER_ACCESS} element={<ProtectedRoute allowedRoles={ROLE_GROUPS.ADMINS}><UserAccessManagement /></ProtectedRoute>} />
      <Route path={ROUTES.ADMIN.ENROLLMENT} element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER, ROLES.THERAPIST]}requiredPermission="canEnrollStudents" ><EnrollStudent /></ProtectedRoute>} />
      <Route path={ROUTES.ADMIN.CLEANUP_STUDENTS} element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}><CleanupOldStudents /></ProtectedRoute>} />

      {/* TEACHER ROUTES */}
      <Route path={ROUTES.TEACHER.DASHBOARD} element={<ProtectedRoute allowedRoles={[ROLES.TEACHER]}><TeacherDashboard /></ProtectedRoute>} />
      <Route path={ROUTES.TEACHER.PROFILE} element={<ProtectedRoute allowedRoles={[ROLES.TEACHER]}><TeacherProfile /></ProtectedRoute>} />
      <Route path={ROUTES.TEACHER.PLAY_GROUP_UPLOAD} element={<ProtectedRoute allowedRoles={[ROLES.TEACHER, ...ROLE_GROUPS.ADMINS]}><PlayGroupActivity /></ProtectedRoute>} />
      <Route path={ROUTES.TEACHER.ENROLLMENT} element={<ProtectedRoute allowedRoles={[ROLES.TEACHER]}><EnrollStudent /></ProtectedRoute>} />

      {/* THERAPIST ROUTES */}
      <Route path={ROUTES.THERAPIST.DASHBOARD} element={<ProtectedRoute allowedRoles={[ROLES.THERAPIST]}><TherapistDashboard /></ProtectedRoute>} />
      <Route path={ROUTES.THERAPIST.SESSION} element={<ProtectedRoute allowedRoles={[ROLES.THERAPIST]}><TherapySessionForm /></ProtectedRoute>} />
      <Route path={ROUTES.THERAPIST.SESSION_FORM} element={<ProtectedRoute allowedRoles={[ROLES.THERAPIST]}><TherapySessionForm /></ProtectedRoute>} />
      <Route path={ROUTES.THERAPIST.PROFILE} element={<ProtectedRoute allowedRoles={[ROLES.THERAPIST]}><TherapistProfile /></ProtectedRoute>} />
      <Route path={ROUTES.THERAPIST.ENROLLMENT} element={<ProtectedRoute allowedRoles={[ROLES.THERAPIST]}><EnrollStudent /></ProtectedRoute>} />

      {/* PARENT ROUTES */}
      <Route path={ROUTES.PARENT.DASHBOARD} element={<ProtectedRoute allowedRoles={[ROLES.PARENT]}><ParentDashboard /></ProtectedRoute>} />
      <Route path={ROUTES.PARENT.CHILD} element={<ProtectedRoute allowedRoles={[ROLES.PARENT]}><ChildActivities /></ProtectedRoute>} />
      <Route path={ROUTES.PARENT.CONCERNS} element={<ProtectedRoute allowedRoles={[ROLES.PARENT]}><ParentConcerns /></ProtectedRoute>} />
      <Route path={ROUTES.PARENT.SUMMARY} element={<ProtectedRoute allowedRoles={[ROLES.PARENT]}><MonthlySummary /></ProtectedRoute>} />

      {/* ERROR ROUTES */}
      <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;