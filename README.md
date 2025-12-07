# SPED School Monitoring System

A web-based monitoring system for Special Education schools with role-based access control.

## Features

- **Admin Dashboard**: Full system access with user management
- **Teacher Dashboard**: Manage assigned children and activities
- **Parent Dashboard**: View child's progress and activities

## Tech Stack

- React 18
- Firebase (Authentication, Firestore)
- React Router v6
- Cloudinary (Image Storage)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication (Email/Password)
3. Create Firestore Database
4. Copy your Firebase configuration

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=your-app-id

REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloud_name
REACT_APP_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

### 4. Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (request.auth.uid == userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Children collection
    match /children/{childId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Activities collection
    match /activities/{activityId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

### 5. Run the Application

```bash
npm start
```

The app will run on http://localhost:3000

## Project Structure

```
Here is the corrected project structure

src/
├── components/
│   ├── common/                # Reusable UI components
│   │   ├── Card.jsx
│   │   ├── ErrorMessage.jsx
│   │   └── Loading.jsx
│   └── sidebar/
│       └── AdminSidebar.jsx   # Admin navigation sidebar
├── config/
│   └── firebase.js            # Firebase initialization
├── context/
│   └── AuthContext.jsx        # Authentication state management
├── hooks/                     # Custom React hooks
│   ├── useAuth.js
│   ├── useEnrollChild.js      # Logic for student enrollment form
│   ├── useManageTeachers.js   # Logic for teacher management
│   └── useOtherServices.js    # Logic for service management
├── pages/
│   ├── admin/                 # Admin-specific pages
│   │   ├── EnrollChild.jsx
│   │   ├── ManageTeachers.jsx
│   │   ├── OneOnOne.jsx       # 1:1 Services Grid View
│   │   ├── OtherServices.jsx
│   │   ├── PlayGroup.jsx      # Admin view for Play Group photos (Calendar View)
│   │   └── PlayGroup.css      # Styles for the Calendar UI
│   ├── auth/
│   │   └── LoginPage.jsx
│   ├── parent/                # Parent-specific pages
│   │   ├── ChildActivities.jsx # Activity feed for a specific child
│   │   └── ParentDashboard.jsx
│   └── teacher/               # Teacher-specific pages
│       ├── PlayGroupActivity.jsx # Upload form for Group Activities
│       └── TeacherDashboard.jsx
├── routes/
│   └── ProtectedRoute.jsx     # Route guard for role-based access
├── services/                  # Backend service layer
│   ├── activityService.js     # Activity retrieval logic
│   ├── authService.js         # Auth operations
│   ├── childService.js        # Student/Child data operations
│   ├── cloudinaryService.js   # Image upload logic
│   ├── servicesService.js     # School service types operations
│   ├── teacherService.js      # Teacher data operations
│   └── userService.js         # General user operations
└── utils/
    └── constants.js           # App constants (Roles, etc.)
```

## User Roles

- **Admin**: Full system access
- **Teacher**: Access to assigned children only
- **Parent**: Access to own children only

## Demo Accounts

- Admin: admin@school.com
- Teacher: teacher@school.com
- Parent: parent@school.com
- Password: password123

## License

MIT