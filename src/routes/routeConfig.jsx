// src/routes/routeConfig.jsx

import React, { Suspense } from "react";
import { Routes, Route, Navigate, useLocation, Link } from "react-router-dom";
import { QueryClient } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";

// Common Components (loaded eagerly - needed immediately)
import Loading from "../components/common/Loading";

// Auth Components (lazy loaded)
const LandingPage = React.lazy(() => import("../pages/auth/LandingPage"));
const ChangePassword = React.lazy(() => import("../pages/auth/ChangePassword"));
const ActivatePage = React.lazy(() => import("../pages/auth/ActivatePage"));
const AdminActivatePage = React.lazy(() => import("../pages/auth/AdminActivatePage"));
const ForgotPasswordPage = React.lazy(() => import("../pages/auth/ForgotPasswordPage"));

// Admin Components (lazy loaded)
const OneOnOne = React.lazy(() => import("../pages/admin/OneOnOne"));
const PlayGroup = React.lazy(() => import("../pages/admin/PlayGroup"));
const ManageTeachers = React.lazy(() => import("../pages/admin/ManageTeachers"));
const ManageTherapists = React.lazy(() => import("../pages/admin/ManageTherapists"));
const EnrollStudent = React.lazy(() => import("../pages/admin/enrollmentTabPages/EnrollStudent"));
const Concerns = React.lazy(() => import("../pages/admin/Concerns"));
const ManageAdmins = React.lazy(() => import("../pages/admin/ManageAdmins"));
const StudentProfile = React.lazy(() => import("../pages/admin/studentProfile/StudentProfile"));
const PendingAccounts = React.lazy(() => import("../pages/admin/PendingAccounts"));
const UserAccessManagement = React.lazy(() => import("../pages/admin/UserAccessManagement"));
const CleanupOldStudents = React.lazy(() => import("../pages/admin/utils/CleanupOldStudents"));

// Teacher Components (lazy loaded)
const TeacherDashboard = React.lazy(() => import("../pages/teacher/TeacherDashboard"));
const PlayGroupActivity = React.lazy(() => import("../pages/teacher/PlayGroupActivity"));
const TeacherProfile = React.lazy(() => import("../pages/teacher/TeacherProfile"));

// Therapist Components (lazy loaded)
const TherapistDashboard = React.lazy(() => import("../pages/therapist/TherapistDashboard"));
const TherapySessionForm = React.lazy(() => import("../pages/therapist/TherapySessionForm"));
const TherapistProfile = React.lazy(() => import("../pages/therapist/TherapistProfile"));

// Parent Components (lazy loaded)
const ParentDashboard = React.lazy(() => import("../pages/parent/ParentChildProfile"));
const ChildActivities = React.lazy(() => import("../pages/parent/ChildActivities"));
const ParentConcerns = React.lazy(() => import("../pages/parent/parentConcernsPages/ParentConcerns"));
const MonthlySummary = React.lazy(() => import("../pages/parent/MonthlySummary"));
const DailyDigest = React.lazy(() => import("../pages/parent/DailyDigest"));

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
  FORGOT_PASSWORD: "/forgot-password",
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
    DIGEST: "/parent/digest",
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
 * 404 Not Found page component
 */
const NotFoundPage = () => {
  const { currentUser } = useAuth();
  const homePath = currentUser ? getHomeRoute(currentUser.role) : ROUTES.LOGIN;

  return (
    <div style={{ padding: "60px 20px", textAlign: "center", maxWidth: "480px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "72px", margin: "0", color: "#FFA500" }}>404</h1>
      <h2 style={{ margin: "8px 0 16px", color: "#1e293b" }}>Page Not Found</h2>
      <p style={{ color: "#64748b", marginBottom: "24px" }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to={homePath}
        style={{
          display: "inline-block",
          padding: "10px 24px",
          backgroundColor: "#FFA500",
          color: "#fff",
          borderRadius: "8px",
          textDecoration: "none",
          fontWeight: "600",
        }}
      >
        Go to Home
      </Link>
    </div>
  );
};

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
    <Suspense fallback={<Loading message="Loading page" />}>
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path={ROUTES.CHANGE_PASSWORD} element={<ChangePassword />} />
      <Route path="/" element={<AuthRedirect><LandingPage /></AuthRedirect>} />
      <Route path={ROUTES.LOGIN} element={<AuthRedirect><LandingPage /></AuthRedirect>} />
      
      {/* NEW: Activation Routes (Public - no auth required) */}
      <Route path={ROUTES.ACTIVATE} element={<ActivatePage />} />
      <Route path={ROUTES.ADMIN_ACTIVATE} element={<AdminActivatePage />} />

      {/* Forgot Password Route (Public) */}
      <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />

      {/* ADMIN ROUTES */}
      <Route path={ROUTES.ADMIN.DASHBOARD} element={<Navigate to={ROUTES.ADMIN.STUDENT_PROFILE} replace />} />
      <Route path={ROUTES.ADMIN.STUDENT_PROFILE} element={<ProtectedRoute allowedRoles={ROLE_GROUPS.ALL_STAFF}><StudentProfile /></ProtectedRoute>} />
      <Route path={ROUTES.ADMIN.ONE_ON_ONE} element={<ProtectedRoute allowedRoles={ROLE_GROUPS.ADMINS}><OneOnOne /></ProtectedRoute>} />
      <Route path={ROUTES.ADMIN.PLAY_GROUP} element={<ProtectedRoute allowedRoles={ROLE_GROUPS.ADMINS}><PlayGroup /></ProtectedRoute>} />
      <Route path={ROUTES.ADMIN.MANAGE_TEACHERS} element={<ProtectedRoute allowedRoles={ROLE_GROUPS.ADMINS}><ManageTeachers /></ProtectedRoute>} />
      <Route path={ROUTES.ADMIN.MANAGE_THERAPISTS} element={<ProtectedRoute allowedRoles={ROLE_GROUPS.ADMINS}><ManageTherapists /></ProtectedRoute>} />
      <Route path={ROUTES.ADMIN.ENROLLMENT} element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.TEACHER, ROLES.THERAPIST]}><EnrollStudent /></ProtectedRoute>} />
      <Route path={ROUTES.ADMIN.CONCERNS} element={<ProtectedRoute allowedRoles={ROLE_GROUPS.ADMINS}><Concerns /></ProtectedRoute>} />
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
      <Route path={ROUTES.PARENT.DIGEST} element={<ProtectedRoute allowedRoles={[ROLES.PARENT]}><DailyDigest /></ProtectedRoute>} />

      {/* ERROR ROUTES */}
      <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
  );
};

export default AppRoutes;