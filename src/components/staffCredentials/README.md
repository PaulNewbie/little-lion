# Staff Credentials Components

This directory contains components for displaying staff credentials to parents.

## Components

### `StaffCredentialsModal.jsx`
Modal component that displays detailed staff credentials including:
- Profile photo, name, and role
- Years of experience
- Specializations
- Professional licenses (supports both therapist array and teacher single license)
- Education history with certificate thumbnails
- Professional certifications with certificate thumbnails

**Props:**
- `staff` (Object): Staff member data
- `isOpen` (Boolean): Modal visibility
- `onClose` (Function): Close handler

**Usage:**
```jsx
<StaffCredentialsModal
  staff={staffMember}
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
/>
```

### `CurrentTeamSection.jsx`
Section component that displays a student's current care team as clickable cards.
- Fetches staff data from serviceEnrollments
- Displays staff cards with photos and primary license
- Opens StaffCredentialsModal on click
- Only shows for parent view

**Props:**
- `student` (Object): Student object with serviceEnrollments array

**Usage:**
```jsx
{isParentView && student?.serviceEnrollments?.length > 0 && (
  <CurrentTeamSection student={student} />
)}
```

## Data Model

### Student serviceEnrollments
```javascript
{
  serviceEnrollments: [
    {
      enrollmentId: 'se_abc123',
      serviceName: 'Speech Therapy',
      serviceType: 'Therapy',
      status: 'active',
      currentStaff: {
        staffId: 'user_xyz789',
        staffName: 'Jane Doe',
        staffRole: 'therapist'
      }
    }
  ]
}
```

### Staff Data
```javascript
// Therapist (licenses array)
{
  uid: 'user_xyz',
  firstName: 'Jane',
  lastName: 'Doe',
  role: 'therapist',
  profilePhoto: 'https://...',
  licenses: [
    {
      licenseType: 'Licensed Speech-Language Pathologist',
      licenseNumber: 'SLP-12345',
      licenseExpirationDate: '2025-12-31'
    }
  ],
  educationHistory: [...],
  certifications: [...],
  yearsExperience: 5,
  specializations: ['Speech Therapy', 'Language Development']
}

// Teacher (single license fields)
{
  uid: 'user_abc',
  firstName: 'John',
  lastName: 'Smith',
  role: 'teacher',
  profilePhoto: 'https://...',
  licenseType: 'Special Education Teacher',
  licenseNumber: 'SPED-67890',
  licenseExpirationDate: '2026-06-30',
  educationHistory: [...],
  certifications: [...],
  yearsExperience: 8,
  specializations: ['Art Therapy', 'Music Class']
}
```

## Accessibility

All components include:
- ARIA labels for screen readers
- Keyboard navigation support
- Focus-visible outlines
- Semantic HTML structure
- Reduced motion support

## Performance

- Staff data is fetched only once per student
- Duplicate staff IDs are filtered out
- Modal lazy loads staff data
- Images use lazy loading
- Optimized for mobile devices

## Styling

Uses CSS variables from TherapistProfile.css:
- `--tp-blue-*`: Primary blue colors
- `--tp-yellow-*`: Accent yellow colors
- `--tp-gray-*`: Neutral grays
- `--tp-success/warning/danger`: Status colors

Responsive breakpoints:
- Desktop: 769px+
- Tablet: 481px - 768px
- Mobile: 480px and below
