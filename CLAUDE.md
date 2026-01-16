# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<<<<<<< HEAD
## Development Commands

```bash
npm install     # Install dependencies
npm start       # Start dev server (Vite on port 3000)
npm run build   # Production build
npm run preview # Preview production build
```

## Architecture Overview

This is a React-based school monitoring system for Special Education (SPED) schools. It uses Firebase for authentication and data storage, with role-based access control for different user types.

### Tech Stack
- React 19 with Vite
- Firebase (Auth, Firestore, Storage)
- React Router v7 for routing
- TanStack React Query for server state
- Cloudinary for image uploads

### User Roles
The system has five roles with different access levels (defined in `src/utils/constants.js` and `src/routes/routeConfig.jsx`):
- `super_admin` - Full system access including admin management and enrollment
- `admin` - Most admin features except managing other admins
- `teacher` - Access to dashboard, profile, play group uploads
- `therapist` - Access to dashboard, therapy sessions, profile
- `parent` - Access to child profiles and inquiries

### Core Patterns

**Authentication Flow** (`src/context/AuthContext.jsx`, `src/services/authService.js`):
- Firebase Auth for authentication
- User data stored in Firestore `users` collection
- New accounts require activation via code before first login
- Temporary Firebase apps are created when creating accounts to avoid logging out the admin

**Route Protection** (`src/routes/routeConfig.jsx`):
- `ProtectedRoute` component guards routes by role
- `ROUTES` object contains all route paths
- `ROLE_GROUPS` defines common role combinations (ADMINS, STAFF, ALL_STAFF)
- `getHomeRoute(role)` returns the default landing page for each role

**Services Layer** (`src/services/`):
- `authService.js` - Authentication, account creation with activation codes
- `userService.js` - User CRUD operations
- `childService.js` - Student/child data operations
- `activityService.js` - Activity tracking
- `assessmentService.js` - Student assessments
- `cloudinaryService.js` - Image uploads to Cloudinary
- `activationService.js` - Account activation code generation/validation
- `inquiryService.js` - Parent inquiries to staff

**Custom Hooks** (`src/hooks/`):
- `useAuth.js` - Access AuthContext
- `useManageTeachers.js`, `useManageTherapists.js`, `useManageAdmins.js` - Staff management logic
- `useActivationModal.js` - Activation code modal state

### Firestore Collections
- `users` - All user accounts with role field
- `children` - Student records
- `activities` - Activity logs

### Environment Variables
Firebase and Cloudinary credentials should be in `.env`:
```
REACT_APP_FIREBASE_API_KEY
REACT_APP_FIREBASE_AUTH_DOMAIN
REACT_APP_FIREBASE_PROJECT_ID
REACT_APP_FIREBASE_STORAGE_BUCKET
REACT_APP_FIREBASE_MESSAGING_SENDER_ID
REACT_APP_FIREBASE_APP_ID
REACT_APP_CLOUDINARY_CLOUD_NAME
REACT_APP_CLOUDINARY_UPLOAD_PRESET
```

Note: Currently using Vite, so environment variables should use `VITE_` prefix, but the codebase references `REACT_APP_` (legacy from CRA migration).
=======
## Project Overview

Little Lions Monitoring System - A React web application for Special Education (SPED) schools with role-based access control. Built for managing students, teachers, therapists, and parent communication.

## Development Commands

```bash
npm start      # Start dev server on localhost:3000
npm run build  # Production build
npm run preview # Preview production build
```

## Architecture

### Tech Stack
- React 19 with Vite
- Firebase (Auth, Firestore)
- Cloudinary (Image uploads)
- TanStack React Query (Server state)
- React Router v7

### Role-Based Access
Five user roles with different permissions:
- `super_admin` - Full system access, can manage admins and enrollment
- `admin` - Manage teachers, therapists, students, view activities
- `teacher` - View assigned students, upload play group activities
- `therapist` - Manage therapy sessions for assigned students
- `parent` - View own children's activities and submit inquiries

### Key Directory Structure

**`src/routes/routeConfig.jsx`** - Central routing configuration with:
- Route path constants (`ROUTES`)
- Role constants (`ROLES`, `ROLE_GROUPS`)
- `ProtectedRoute` component for role-based access
- React Query client configuration

**`src/context/AuthContext.jsx`** - Authentication state via Firebase, provides `currentUser`, `login`, `logout`

**`src/services/`** - Backend service layer (all Firestore/Firebase operations):
- `authService.js` - Sign in/out, user data
- `childService.js` - Student CRUD
- `activityService.js` - Activity logging
- `assessmentService.js` - Assessment records
- `cloudinaryService.js` - Image uploads
- `inquiryService.js` - Parent inquiries
- `activationService.js` - Account activation flow
- `userService.js` - User profile operations

**`src/hooks/`** - Custom hooks for business logic (useAuth, useManageTeachers, useManageTherapists, etc.)

**`src/pages/`** - Organized by role:
- `admin/` - Student profiles, enrollment forms, staff management
- `teacher/` - Dashboard, play group uploads
- `therapist/` - Session forms, dashboard
- `parent/` - Child activities, inquiries
- `auth/` - Login, activation pages
- `shared/` - Cross-role components

### Account Activation Flow
New accounts use `accountStatus: 'pending_setup'` - users are redirected to `/activate` to set their password. Legacy accounts use `mustChangePassword` flag.

## Environment Variables

For local development, create `.env` with:
- `VITE_FIREBASE_*` - Firebase config
- `VITE_CLOUDINARY_*` - Cloudinary config

Note: The codebase currently has Firebase config hardcoded in `src/config/firebase.js`.
>>>>>>> 8be344ddf69e960d2c64aab47049ad04c86e9a8d
