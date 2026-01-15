# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
