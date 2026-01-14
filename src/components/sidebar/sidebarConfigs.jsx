// Sidebar menu configurations for each role
import SP_Icon from "../../images/sp-icon.svg";
import ooo_Icon from "../../images/1on1-icon.svg";
import group_Icon from "../../images/group-class-icon.svg";
import enroll_Icon from "../../images/enroll-icon.svg";
import admin_Icon from "../../images/admin-icon.svg";
import teacher_Icon from "../../images/teacher-icon.svg";
import therapist_Icon from "../../images/therapist-icon/therapist1.svg";

// SVG Icons as React elements
const HomeIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);

const MessageIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

const PersonIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
);

const ProfileIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
  </svg>
);

const MailIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
  </svg>
);

const ClockIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
  </svg>
);

const ShieldIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
  </svg>
);

/**
 * Get admin sidebar configuration
 * @param {boolean} isSuperAdmin - Whether current user is super admin
 * @returns {Object} Sidebar configuration
 */
export const getAdminConfig = (isSuperAdmin = false) => ({
  role: "admin",
  roleLabel: isSuperAdmin ? "SUPER ADMIN" : "ADMINISTRATOR",
  avatar: "🦁",
  menuSections: [
    {
      title: "MAIN",
      items: [
        { path: "/admin/StudentProfile", icon: SP_Icon, label: "STUDENT PROFILE" },
        { path: "/admin/one-on-one", icon: ooo_Icon, label: "1 on 1 SERVICES" },
        { path: "/admin/play-group", icon: group_Icon, label: "GROUP CLASSES" },
        { path: "/admin/enrollment", icon: enroll_Icon, label: "ENROLL STUDENT", hidden: !isSuperAdmin },
        { path: "/admin/concerns", icon: MailIcon, label: "CONCERNS" },
      ]
    },
    {
      title: "USER MANAGEMENT",
      items: [
        { path: "/admin/manage-admins", icon: admin_Icon, label: "ADMIN", hidden: !isSuperAdmin },
        { path: "/admin/manage-teachers", icon: teacher_Icon, label: "TEACHER" },
        { path: "/admin/manage-therapists", icon: therapist_Icon, label: "THERAPIST" },
        { path: "/admin/pending-accounts", icon: ClockIcon, label: "PENDING ACCOUNTS" },
        { path: "/admin/user-access", icon: ShieldIcon, label: "USER ACCESS" },
      ]
    }
  ]
});

/**
 * Get parent sidebar configuration
 * @returns {Object} Sidebar configuration
 */
export const getParentConfig = () => ({
  role: "parent",
  roleLabel: "PARENT",
  avatar: "👤",
  menuSections: [
    {
      title: "MAIN",
      items: [
        { path: "/parent/dashboard", icon: HomeIcon, label: "MY CHILDREN" },
        { path: "/parent/inquiries", icon: MessageIcon, label: "INQUIRIES" },
      ]
    }
  ]
});

/**
 * Get therapist sidebar configuration
 * @param {boolean} profileCompleted - Whether profile is completed
 * @returns {Object} Sidebar configuration
 */
export const getTherapistConfig = (profileCompleted = true) => ({
  role: "therapist",
  roleLabel: "THERAPIST",
  avatar: "👨‍⚕️",
  menuSections: [
    {
      title: "MAIN",
      items: [
        { path: "/therapist/dashboard", icon: PersonIcon, label: "MY STUDENTS" },
        {
          path: "/therapist/profile",
          icon: ProfileIcon,
          label: "MY PROFILE",
          showNotification: !profileCompleted
        },
        { path: "/therapist/enrollment", icon: enroll_Icon, label: "ENROLL STUDENT" },
        { path: "/staff/inquiries", icon: MailIcon, label: "INQUIRIES" },
      ]
    }
  ]
});

/**
 * Get teacher sidebar configuration
 * @param {boolean} profileCompleted - Whether profile is completed
 * @returns {Object} Sidebar configuration
 */
export const getTeacherConfig = (profileCompleted = true) => ({
  role: "teacher",
  roleLabel: "TEACHER",
  avatar: "👩‍🏫",
  menuSections: [
    {
      title: "MAIN",
      items: [
        { path: "/teacher/dashboard", icon: PersonIcon, label: "MY CLASS" },
        {
          path: "/teacher/profile",
          icon: ProfileIcon,
          label: "MY PROFILE",
          showNotification: !profileCompleted
        },
        { path: "/teacher/enrollment", icon: enroll_Icon, label: "ENROLL STUDENT" },
        { path: "/staff/inquiries", icon: MailIcon, label: "INQUIRIES" },
      ]
    }
  ]
});
