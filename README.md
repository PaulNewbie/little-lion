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
src/
├── components/
│   ├── auth/          # Login, ProtectedRoute
│   ├── admin/         # Admin dashboard and features
│   ├── teacher/       # Teacher dashboard
│   ├── parent/        # Parent dashboard
│   └── common/        # Shared components
├── services/          # Firebase and API services
├── context/           # React Context (Auth)
├── hooks/             # Custom React hooks
└── utils/             # Helper functions and constants
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