# Little Lions Monitoring System

A comprehensive web-based monitoring and management system built for Special Education (SPED) schools. The platform enables staff to track student activities, therapy sessions, and progress while keeping parents informed and engaged in their child's development.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Target Users & Roles](#target-users--roles)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Firebase Setup](#firebase-setup)
- [Available Scripts](#available-scripts)
- [Firestore Collections](#firestore-collections)
- [Authentication & Authorization](#authentication--authorization)
- [Route Map](#route-map)
- [Services Layer](#services-layer)
- [Custom Hooks](#custom-hooks)
- [Caching Strategy](#caching-strategy)
- [Security](#security)
- [PWA Support](#pwa-support)
- [Error Monitoring](#error-monitoring)
- [Known Considerations](#known-considerations)
- [License](#license)

---

## Project Overview

Little Lions Monitoring System is a role-based web application designed specifically for SPED (Special Education) schools. It provides a centralized platform for administrators, teachers, therapists, and parents to collaborate on student care. The system supports student enrollment with comprehensive assessment forms, activity logging (play groups and one-on-one sessions), therapy session tracking with FERPA compliance, credential management for staff, and a parent-facing dashboard with daily digests and monthly summaries.

---

## Key Features

### Administration
- Student enrollment with multi-step assessment forms (9 steps)
- Staff management (teachers, therapists, admins)
- User access and permission management
- Account activation via user-friendly codes (WORD-1234 format)
- Pending account review and approval
- Service enrollment management per student
- Concerns and inquiry tracking

### Staff (Teachers & Therapists)
- Dashboard with assigned students and upcoming activities
- Play group activity uploads with photo documentation
- One-on-one therapy session recording (therapists)
- Multi-step session form wizard
- Professional profile management (licenses, education, certifications)
- Credential tracking with expiration status

### Parents
- Child activity feed and progress tracking
- Daily digest with photo highlights
- Monthly activity summary reports
- Concern submission to staff
- Inquiry system for parent-staff communication
- Profile photo upload

### General
- Offline-first PWA with service worker caching
- Real-time data synchronization via Firestore listeners
- Role-based route protection
- Toast notification system
- Image uploads via Cloudinary
- Voice-to-text input for assessment forms
- Responsive mobile-first design

---

## Target Users & Roles

| Role | Access Level | Description |
|------|-------------|-------------|
| **Super Admin** | Full system access | Manages all users including other admins, enrollment, cleanup utilities |
| **Admin** | Most admin features | Staff management, student enrollment, activity oversight (cannot manage other admins) |
| **Teacher** | Teaching tools | Dashboard, play group activity uploads, profile management |
| **Therapist** | Clinical tools | Dashboard, therapy session forms, profile management |
| **Parent** | Child-focused view | Child activities, daily digests, monthly summaries, inquiries, concerns |

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.2 | UI framework |
| React Router | 7.10 | Client-side routing |
| Vite | 7.3 | Build tool and dev server |
| TanStack React Query | 5.90 | Server state management and caching |
| Lucide React | 0.562 | Icon library |
| React Calendar | 6.0 | Calendar component for activity views |

### Backend & Services
| Technology | Version | Purpose |
|-----------|---------|---------|
| Firebase Auth | 12.6 | Authentication (email/password) |
| Cloud Firestore | 12.6 | NoSQL database with real-time sync |
| Firebase Storage | 12.6 | File storage |
| Cloudinary | - | Image upload and CDN delivery |

### Development & Quality
| Technology | Version | Purpose |
|-----------|---------|---------|
| Vitest | 4.0 | Unit testing framework |
| Playwright | 1.58 | End-to-end testing |
| Sentry | 10.38 | Error monitoring and reporting |
| vite-plugin-pwa | 1.2 | Progressive Web App support |

### Languages
- **JavaScript (ES6+)** - Primary language
- **JSX** - React component syntax
- **CSS** - Styling (component-scoped CSS files)
- **HTML** - Entry point template

---

## System Architecture

```
                         +------------------+
                         |   React 19 App   |
                         |  (Vite + PWA)    |
                         +--------+---------+
                                  |
              +-------------------+-------------------+
              |                   |                   |
     +--------v--------+ +-------v-------+ +---------v--------+
     |  AuthContext     | | ToastContext  | | UnreadConcerns   |
     |  (User State)   | | (Notifications)| | Context          |
     +--------+--------+ +---------------+ +------------------+
              |
     +--------v--------+
     |   React Router   |
     |  (Role Guards)   |
     +--------+---------+
              |
    +---------+---------+------------------+
    |         |         |                  |
+---v---+ +--v----+ +--v------+ +--------v-------+
| Admin | |Teacher| |Therapist| |    Parent       |
| Pages | | Pages | |  Pages  | |    Pages        |
+---+---+ +--+----+ +--+------+ +--------+-------+
    |         |         |                  |
    +----+----+----+----+-----+------------+
         |         |          |
  +------v------+ +v---------v-+  +--------+
  |  Services   | |   Hooks    |  | Utils  |
  |  Layer      | |  (Custom)  |  |        |
  +------+------+ +-----+------+  +--------+
         |               |
  +------v---------------v------+
  |     TanStack React Query    |
  |   (Cache + Server State)    |
  +------+----------------------+
         |
  +------v------+    +----------+
  |  Firebase   |    | Cloudinary|
  | Auth + DB   |    |  (Images) |
  +-------------+    +----------+
```

**Data Flow**: Components use custom hooks that call services. Services interact with Firebase/Cloudinary. React Query manages caching, background refetching, and offline support. AuthContext provides user state globally. Route guards enforce role-based access.

---

## Project Structure

```
little-lion/
├── public/                             # Static assets
│   ├── manifest.json                   # PWA manifest
│   ├── logo.png                        # App logo/icon
│   └── assets/                         # Static images
│
├── src/
│   ├── App.jsx                         # Root component with providers
│   ├── index.jsx                       # React DOM entry point
│   ├── index.css                       # Global styles
│   │
│   ├── config/                         # App configuration
│   │   ├── firebase.js                 # Firebase initialization & persistence
│   │   ├── queryClient.js             # React Query config & cache strategy
│   │   └── errorReporting.js          # Sentry error monitoring setup
│   │
│   ├── context/                        # React Context providers
│   │   ├── AuthContext.jsx            # Auth state, user data, login/logout
│   │   ├── ToastContext.jsx           # Toast notification queue
│   │   └── UnreadConcernsContext.jsx  # Unread concerns badge count
│   │
│   ├── routes/
│   │   └── routeConfig.jsx           # All routes, role guards, role groups
│   │
│   ├── services/                       # Data access layer (Firebase/Cloudinary)
│   │   ├── authService.js             # Sign in, sign out, account creation
│   │   ├── userService.js            # User CRUD, staff queries
│   │   ├── childService.js           # Student CRUD, service enrollments
│   │   ├── activityService.js        # Activities, play groups, comments
│   │   ├── assessmentService.js      # Student assessments
│   │   ├── activationService.js      # Account activation codes
│   │   ├── cloudinaryService.js      # Image upload to Cloudinary
│   │   ├── inquiryService.js         # Parent-staff inquiries
│   │   ├── concernService.js         # Concerns with threaded messages
│   │   ├── offeringsService.js       # School service offerings
│   │   ├── summaryService.js         # Monthly activity summaries
│   │   ├── digestService.js          # Daily activity digests
│   │   └── therapySessionService.js  # Therapy session operations
│   │
│   ├── hooks/                          # Custom React hooks
│   │   ├── useAuth.js                 # Access AuthContext
│   │   ├── useProfileForm.js         # Profile form state & save logic
│   │   ├── useManageTeachers.js      # Teacher management operations
│   │   ├── useManageTherapists.js    # Therapist management operations
│   │   ├── useManageAdmins.js        # Admin management operations
│   │   ├── useManageStaff.js         # General staff operations
│   │   ├── useStudentProfileData.js  # Student profile data fetching
│   │   ├── useServiceEnrollments.js  # Service enrollment queries
│   │   ├── useRoleBasedData.js       # Role-specific data fetching
│   │   ├── useCachedData.js          # React Query caching helpers
│   │   ├── useDailyDigest.js         # Daily digest data
│   │   ├── useActivationModal.js     # Activation modal state
│   │   ├── useAdminConcerns.js       # Admin concerns list
│   │   ├── useParentConcerns.js      # Parent concerns list
│   │   ├── useOtherServices.js       # Service management
│   │   └── usePageTracker.js         # Page navigation tracking
│   │
│   ├── pages/                          # Page components organized by role
│   │   ├── admin/
│   │   │   ├── ManageTeachers.jsx     # Teacher list & CRUD
│   │   │   ├── ManageTherapists.jsx   # Therapist list & CRUD
│   │   │   ├── ManageAdmins.jsx       # Admin management (super_admin)
│   │   │   ├── OneOnOne.jsx           # 1:1 services grid view
│   │   │   ├── PlayGroup.jsx          # Play group calendar view
│   │   │   ├── Concerns.jsx           # Concerns management
│   │   │   ├── PendingAccounts.jsx    # Pending activations
│   │   │   ├── UserAccessManagement.jsx # User permissions
│   │   │   ├── enrollmentTabPages/
│   │   │   │   ├── EnrollStudent.jsx  # Student list for enrollment
│   │   │   │   └── enrollmentForm/    # 9-step enrollment wizard
│   │   │   │       ├── EnrollStudentFormModal.jsx
│   │   │   │       └── components/    # Step1 through Step9 forms
│   │   │   ├── studentProfile/
│   │   │   │   ├── StudentProfile.jsx # Student detail view
│   │   │   │   └── components/        # Profile sub-components
│   │   │   └── utils/
│   │   │       └── CleanupOldStudents.jsx
│   │   │
│   │   ├── auth/
│   │   │   ├── LandingPage.jsx        # Login landing page
│   │   │   ├── LoginPage.jsx          # Login form
│   │   │   ├── ActivatePage.jsx       # Account activation
│   │   │   ├── AdminActivatePage.jsx  # Admin activation
│   │   │   ├── ForgotPasswordPage.jsx # Password reset
│   │   │   └── ChangePassword.jsx     # Legacy password change
│   │   │
│   │   ├── teacher/
│   │   │   ├── TeacherDashboard.jsx   # Teacher home with FAB
│   │   │   ├── TeacherProfile.jsx     # Profile with credentials
│   │   │   ├── PlayGroupActivity.jsx  # Upload group activities
│   │   │   └── components/
│   │   │
│   │   ├── therapist/
│   │   │   ├── TherapistDashboard.jsx # Therapist home
│   │   │   ├── TherapistProfile.jsx   # Profile with licenses
│   │   │   ├── TherapySessionForm.jsx # Multi-step session wizard
│   │   │   └── components/
│   │   │
│   │   ├── parent/
│   │   │   ├── ParentChildProfile.jsx # Child list dashboard
│   │   │   ├── ChildActivities.jsx    # Activity feed for child
│   │   │   ├── DailyDigest.jsx        # Daily activity digest
│   │   │   ├── MonthlySummary.jsx     # Monthly summary report
│   │   │   ├── NewInquiry.jsx         # Submit inquiry to staff
│   │   │   ├── components/            # Parent UI components
│   │   │   └── parentConcernsPages/   # Concerns for parents
│   │   │
│   │   └── shared/                     # Cross-role components
│   │       ├── AssessmentHistory.jsx
│   │       ├── StaffInquiries.jsx
│   │       └── profile/               # Shared profile components
│   │
│   ├── components/                     # Reusable UI components
│   │   ├── common/                    # Shared components
│   │   │   ├── BackButton.jsx
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── ChildSelector.jsx
│   │   │   ├── ErrorBoundary.jsx
│   │   │   ├── ImageLightbox.jsx
│   │   │   ├── Loading.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── OfflineIndicator.jsx
│   │   │   ├── SearchInput.jsx
│   │   │   ├── Toast.jsx
│   │   │   ├── WelcomeModal.jsx
│   │   │   └── form-elements/
│   │   │       ├── QuickSelectTags.jsx
│   │   │       └── VoiceInput.jsx
│   │   ├── activities/
│   │   │   └── ActivityCards.jsx
│   │   ├── admin/
│   │   │   ├── ActivationModal.jsx
│   │   │   └── SpecializationManagerModal.jsx
│   │   ├── concerns/                  # Concerns components
│   │   ├── serviceEnrollments/        # Service management UI
│   │   ├── sidebar/
│   │   │   ├── Sidebar.jsx
│   │   │   └── sidebarConfigs.jsx
│   │   └── staffCredentials/          # Staff credential viewer
│   │
│   ├── utils/                          # Utility functions
│   │   ├── constants.js               # Roles, service types, statuses
│   │   ├── permissions.js             # Permission checking logic
│   │   ├── validation.js              # Form validation rules
│   │   ├── codeGenerator.js           # Activation code generation
│   │   ├── profileHelpers.js          # Profile utilities
│   │   └── denormalization.js         # Data denormalization helpers
│   │
│   ├── images/                         # Image assets
│   └── audio/                          # Audio assets
│
├── firestore.rules                     # Firestore security rules
├── firestore.indexes.json             # Composite index definitions
├── firebase.json                       # Firebase project config
├── vite.config.js                      # Vite build configuration
├── vitest.config.js                    # Test configuration
├── package.json                        # Dependencies and scripts
├── index.html                          # HTML entry point
└── .env                                # Environment variables (not committed)
```

---

## Installation & Setup

### Prerequisites
- **Node.js** 18 or higher
- **npm** 9 or higher
- A **Firebase** project with Authentication and Firestore enabled
- A **Cloudinary** account for image uploads

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/PaulNewbie/little-lion.git
   cd little-lion
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the project root (see [Environment Variables](#environment-variables) below).

4. **Deploy Firestore rules and indexes**
   ```bash
   firebase deploy --only firestore:rules
   firebase deploy --only firestore:indexes
   ```

5. **Start the development server**
   ```bash
   npm start
   ```
   The app runs at `http://localhost:3000` and is accessible on the local network.

6. **Build for production**
   ```bash
   npm run build
   ```

---

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your_app_id

# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# Error Monitoring (Optional)
VITE_SENTRY_DSN=your_sentry_dsn
```

> **Note:** All client-side environment variables must be prefixed with `VITE_` for Vite to expose them to the application.

---

## Firebase Setup

### 1. Authentication
- Enable **Email/Password** sign-in method in Firebase Console
- No other providers are required

### 2. Firestore Database
- Create a Firestore database in **production mode**
- Deploy security rules from `firestore.rules`
- Deploy composite indexes from `firestore.indexes.json`

### 3. Required Composite Indexes
| Collection | Fields | Purpose |
|-----------|--------|---------|
| `activities` | `type` ASC, `date` DESC | Play group activity filtering |
| `children` | `assignedStaffIds` CONTAINS, `status` ASC | Staff-filtered student lists |

### 4. Firebase Storage
- Enable Firebase Storage for file uploads
- Configure storage rules for authenticated access

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Vite dev server on port 3000 (network accessible) |
| `npm run build` | Create production build in `dist/` |
| `npm run preview` | Preview production build locally |
| `npm test` | Run tests in watch mode (Vitest) |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Run tests with coverage report |

---

## Firestore Collections

| Collection | Description | Access |
|-----------|-------------|--------|
| `users` | All user accounts with role, permissions, profile data | Authenticated read; role-based write |
| `children` | Student records with assessments and service enrollments | Staff read all; parents read own children |
| `activities` | Play group and general activities with photos | Staff read all; parents read own children's |
| `therapy_sessions` | Clinical therapy session records (FERPA-protected) | Staff read all; parents read own children's only |
| `assessments` | Student assessment data | Staff read; enrollment permission to create |
| `activation_codes` | Account activation codes (document ID = code) | Public get by ID; admin create |
| `services` | School service type definitions | Authenticated read; admin write |
| `concerns` | Parent-staff concerns with threaded messages | Creator and admin access |
| `inquiries` | Parent-staff inquiries | Creator, target staff, and admin access |
| `metadata` | Cached summaries and aggregated data | Authenticated read; admin write |
| `migration_logs` | Data migration tracking | Admin read only |

---

## Authentication & Authorization

### Account Creation Flow
1. Admin creates account via management page
2. A temporary Firebase app is used (to avoid logging out the admin)
3. An activation code is generated in `WORD-1234` format (parent-friendly)
4. Account is created with `accountStatus: 'pending_setup'`
5. Admin shares the activation code with the new user
6. User navigates to `/activate`, enters code, and sets their password
7. Account status changes to `active`

### Activation Code Details
- **Format:** `WORD-1234` (friendly for parents, including older users at SPED schools)
- **Expiry:** 7 days from creation
- **Storage:** Document ID in `activation_codes` collection
- **UX:** In-page password setup (warm, guided experience)

### Route Protection
Routes are protected by the `ProtectedRoute` component in `routeConfig.jsx`. Each route specifies which roles can access it. Unauthorized users are redirected to their role's home page.

### Permission System
- `super_admin` bypasses all permission checks
- Granular permissions stored on user documents (e.g., `permissions.canEnrollStudents`)
- Privilege escalation is blocked at the Firestore rules level (users cannot modify their own `role`, `permissions`, or `permissionsHistory`)

---

## Route Map

### Public Routes
| Path | Page | Description |
|------|------|-------------|
| `/` | LandingPage | Login landing page |
| `/login` | LoginPage | Login form |
| `/activate` | ActivatePage | Account activation |
| `/forgot-password` | ForgotPasswordPage | Password reset |

### Admin Routes
| Path | Page | Roles |
|------|------|-------|
| `/admin/StudentProfile` | StudentProfile | super_admin, admin |
| `/admin/one-on-one` | OneOnOne | super_admin, admin |
| `/admin/play-group` | PlayGroup | super_admin, admin |
| `/admin/manage-teachers` | ManageTeachers | super_admin, admin |
| `/admin/manage-therapists` | ManageTherapists | super_admin, admin |
| `/admin/enrollment` | EnrollStudent | super_admin, admin |
| `/admin/concerns` | Concerns | super_admin, admin |
| `/admin/manage-admins` | ManageAdmins | super_admin only |
| `/admin/pending-accounts` | PendingAccounts | super_admin, admin |
| `/admin/user-access` | UserAccessManagement | super_admin, admin |

### Teacher Routes
| Path | Page |
|------|------|
| `/teacher/dashboard` | TeacherDashboard |
| `/teacher/profile` | TeacherProfile |
| `/teacher/play-group-upload` | PlayGroupActivity |
| `/teacher/enrollment` | EnrollStudent |

### Therapist Routes
| Path | Page |
|------|------|
| `/therapist/dashboard` | TherapistDashboard |
| `/therapist/session/:studentId` | TherapySessionForm |
| `/therapist/profile` | TherapistProfile |
| `/therapist/enrollment` | EnrollStudent |

### Parent Routes
| Path | Page |
|------|------|
| `/parent/dashboard` | ParentChildProfile |
| `/parent/child/:childId` | ChildActivities |
| `/parent/concerns` | ParentConcerns |
| `/parent/summary` | MonthlySummary |
| `/parent/digest` | DailyDigest |

---

## Services Layer

The services layer (`src/services/`) abstracts all Firebase and Cloudinary operations. Each service module handles a specific domain:

| Service | Responsibilities |
|---------|-----------------|
| `authService` | Sign in/out, account creation (via temp Firebase apps), password reset |
| `userService` | User CRUD, staff/teacher/therapist/admin queries |
| `childService` | Student CRUD, service enrollments, staff history, pagination |
| `activityService` | Activity creation/retrieval, play group listeners, comments |
| `assessmentService` | Assessment CRUD, assessment history |
| `activationService` | Code generation, validation, activation completion |
| `cloudinaryService` | Image upload/delete via Cloudinary API |
| `inquiryService` | Parent inquiry creation and management |
| `concernService` | Concern creation, threaded messages, resolution |
| `offeringsService` | School service type definitions |
| `summaryService` | Monthly activity summary generation |
| `digestService` | Daily activity digest generation |

---

## Custom Hooks

| Hook | Purpose |
|------|---------|
| `useAuth` | Access authentication context (currentUser, login, logout) |
| `useProfileForm` | Manages profile form state, validation, and saving for staff profiles |
| `useManageTeachers` | Teacher list operations with React Query |
| `useManageTherapists` | Therapist list operations with React Query |
| `useManageAdmins` | Admin management operations |
| `useManageStaff` | General staff operations |
| `useStudentProfileData` | Student profile and related data fetching |
| `useServiceEnrollments` | Service enrollment data per student |
| `useRoleBasedData` | Role-specific data fetching |
| `useCachedData` | React Query caching helper utilities |
| `useDailyDigest` | Daily digest data for parents |
| `useActivationModal` | Activation code modal state management |
| `useAdminConcerns` | Admin concerns list and filtering |
| `useParentConcerns` | Parent concerns list and filtering |
| `useOtherServices` | Service management operations |
| `usePageTracker` | Page navigation event tracking |

---

## Caching Strategy

The application uses TanStack React Query with a tiered caching strategy defined in `src/config/queryClient.js`:

| Tier | Stale Time | Cache Time | Use Case |
|------|-----------|------------|----------|
| **Static** | 60 min | 24 hrs | Services, offerings (rarely change) |
| **Semi-Static** | 30 min | 12 hrs | Staff lists, student lists |
| **Dynamic** | 5 min | 1 hr | Sessions, activities |
| **Realtime** | 30 sec | 5 min | Live dashboards |

Additional features:
- Automatic cache invalidation on mutations
- Prefetch utilities for student profiles and activities
- Offline network mode with background refetching

---

## Security

### Firestore Rules
Comprehensive security rules are defined in `firestore.rules`:

- **Privilege escalation prevention:** Users cannot modify their own `role`, `permissions`, or `permissionsHistory` fields
- **Parent-child verification:** `parentHasChild()` function with fallback from `childrenIds` array to `children/{childId}.parentId` for legacy data
- **FERPA compliance:** Therapy sessions are restricted to staff and authorized parents only
- **Activity access control:** `canParentReadActivity()` verifies parent-child relationship before returning activity data
- **Activation code security:** Codes use single-document lookup (no listing), expire in 7 days, deletion restricted to code owner + admins

### Client-Side Security
- Temporary Firebase apps created for account creation (prevents admin logout)
- Temporary passwords are never stored in Firestore
- `accountStatus` field is intentionally writable by users (required for activation flow)
- Auto-backfill of `childrenIds` on parent login for Firestore rules compatibility

---

## PWA Support

The application is a Progressive Web App configured via `vite-plugin-pwa`:

- **Installable** on mobile devices and desktop
- **Offline support** with service worker caching
- **App shell caching** for instant loading
- **Auto-update** when new versions are deployed
- **Manifest:** `Little Lions Monitoring System` with orange theme (#FFA500)

---

## Error Monitoring

Sentry integration (`src/config/errorReporting.js`) provides:

- Automatic error capture in production
- User context tracking (uid and role)
- 20% transaction sampling rate
- Graceful degradation when no DSN is configured
- Console logging fallback in development mode

---

## Known Considerations

- **Build size:** The production bundle includes a large chunk (~1.4MB) due to Firebase SDK. This is pre-existing and expected.
- **Firestore persistence:** Uses `persistentLocalCache()` with `persistentMultipleTabManager()` and falls back to `enableIndexedDbPersistence()` for older browsers.
- **Query limits:** Activity and concern queries default to `limit(50)` for performance.
- **Legacy accounts:** Some accounts may use the older `mustChangePassword` flag instead of `accountStatus: 'pending_setup'`. Both flows are supported.

---

## License

MIT
