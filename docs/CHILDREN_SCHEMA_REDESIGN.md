# Children Schema Redesign

## Current Problem

Two data models coexist, causing fetch/write mismatches:

| Operation | Writes To | Reads From |
|-----------|-----------|------------|
| Enrollment Form (Step 9) | `oneOnOneServices[]`, `groupClassServices[]` | - |
| Profile Add Service | `serviceEnrollments[]` | - |
| ServiceEnrollmentsPanel | - | `serviceEnrollments[]` only |
| Staff Query | - | `assignedStaffIds[]` |

**Result**: Newly enrolled students have services in legacy arrays, but the profile reads from `serviceEnrollments` (empty).

---

## New Clean Schema

### Primary Service Storage: `serviceEnrollments[]`

Single source of truth for all services with full tracking:

```javascript
{
  // Student identification
  id: "child-doc-id",
  parentId: "parent-uid",
  firstName: "John",
  lastName: "Doe",
  // ... other student fields ...

  // === SERVICE DATA (New Clean Model) ===

  // Primary service storage - single source of truth
  serviceEnrollments: [
    {
      enrollmentId: "se_abc123",           // Unique ID for this enrollment
      serviceId: "service-doc-id",          // FK to services collection
      serviceName: "Speech Therapy",        // Denormalized for display
      serviceType: "Therapy",               // "Therapy" or "Class"
      status: "active",                     // "active" or "inactive"

      // Current staff assignment
      currentStaff: {
        staffId: "staff-uid",
        staffName: "Jane Smith",
        staffRole: "therapist",             // "therapist" or "teacher"
        assignedAt: "2024-01-15T10:00:00Z",
        assignedBy: "admin-uid"
      },

      // Staff change history (audit trail)
      staffHistory: [
        {
          historyId: "sh_xyz789",
          staffId: "old-staff-uid",
          staffName: "Previous Therapist",
          staffRole: "therapist",
          assignedAt: "2023-06-01T10:00:00Z",
          removedAt: "2024-01-15T10:00:00Z",
          removalReason: "Staff Reassignment",
          removedBy: "admin-uid",
          durationDays: 228
        }
      ],

      // Enrollment metadata
      enrolledAt: "2023-06-01T10:00:00Z",
      statusChangedAt: "2024-01-15T10:00:00Z",
      statusChangeReason: null,             // Reason if deactivated
      frequency: "2x weekly",               // From Step 4 interventions
      notes: null,
      lastActivityDate: null
    }
  ],

  // === COMPUTED FIELDS (for efficient queries) ===

  // Active staff IDs - enables: where('assignedStaffIds', 'array-contains', staffId)
  assignedStaffIds: ["staff-uid-1", "staff-uid-2"],

  // All historical staff (for comprehensive history views)
  allHistoricalStaffIds: ["staff-uid-1", "staff-uid-2", "old-staff-uid"],

  // === LEGACY FIELDS (to be removed after migration) ===
  // These will be prefixed with _legacy_ during migration
  // oneOnOneServices: [],      // DEPRECATED
  // groupClassServices: [],    // DEPRECATED
  // enrolledServices: [],      // DEPRECATED
}
```

### Fields Summary

| Field | Purpose | Computed? |
|-------|---------|-----------|
| `serviceEnrollments[]` | All service data with history | No |
| `assignedStaffIds[]` | Active staff for queries | Yes (from active enrollments) |
| `allHistoricalStaffIds[]` | All staff ever assigned | Yes (from all enrollments) |

---

## Data Flow Changes

### Step 4 (Background History) - No Change
Still collects interventions:
```javascript
backgroundHistory.interventions: [
  { serviceType: "Therapy", serviceId: "svc1", name: "Speech Therapy", frequency: "2x weekly" },
  { serviceType: "Class", serviceId: "svc2", name: "Play Group", frequency: "3x weekly" }
]
```

### Step 9 (Service Enrollment) - CHANGE NEEDED

**Current**: Creates `oneOnOneServices[]` and `groupClassServices[]`

**New**: Create `serviceEnrollments[]` directly:

```javascript
// Step 9 should build this format:
serviceEnrollments: [
  {
    enrollmentId: generateEnrollmentId(),
    serviceId: selectedService.id,
    serviceName: selectedService.name,
    serviceType: selectedService.type,  // "Therapy" or "Class"
    status: "active",
    currentStaff: {
      staffId: selectedStaff.uid,
      staffName: `${selectedStaff.firstName} ${selectedStaff.lastName}`,
      staffRole: selectedStaff.role,
      assignedAt: new Date().toISOString(),
      assignedBy: currentUser.uid
    },
    staffHistory: [],
    enrolledAt: new Date().toISOString(),
    statusChangedAt: new Date().toISOString(),
    statusChangeReason: null,
    frequency: intervention.frequency,  // From Step 4
    notes: null,
    lastActivityDate: null
  }
]
```

### createOrUpdateChild() - CHANGE NEEDED

Should compute `assignedStaffIds` from `serviceEnrollments`:

```javascript
// In childService.createOrUpdateChild()
const assignedStaffIds = this.computeStaffIdsFromEnrollments(childData.serviceEnrollments);

const dataToSave = {
  ...childData,
  assignedStaffIds: assignedStaffIds.assignedStaffIds,
  allHistoricalStaffIds: assignedStaffIds.allHistoricalStaffIds,
  // Remove legacy arrays
  oneOnOneServices: undefined,
  groupClassServices: undefined,
  enrolledServices: undefined,
};
```

---

## Migration Strategy

### Phase 1: Update Code (Before Migration)

1. **Update Step9ServiceEnrollment.jsx**
   - Change output format from legacy arrays to `serviceEnrollments[]`
   - Include `frequency` from Step 4 interventions

2. **Update EnrollStudentFormModal.jsx**
   - Change `INITIAL_STUDENT_STATE` to use `serviceEnrollments: []`
   - Remove `oneOnOneServices: []` and `groupClassServices: []`

3. **Update childService.createOrUpdateChild()**
   - Compute `assignedStaffIds` from `serviceEnrollments` (not legacy arrays)
   - Don't save legacy arrays

### Phase 2: Migrate Existing Data

Use the existing `migrateToServiceEnrollments()` method:

```javascript
// Admin migration page or script
const { migrateAll } = useServiceEnrollmentMigration();
const result = await migrateAll({ batchSize: 50 });
console.log(result);
// { total: 100, migrated: 95, skipped: 5, failed: 0 }
```

The migration:
1. Converts `oneOnOneServices[]` and `groupClassServices[]` to `serviceEnrollments[]`
2. Preserves frequency from Step 4 interventions if available
3. Backs up legacy data as `_legacy_oneOnOneServices`, `_legacy_groupClassServices`
4. Recomputes `assignedStaffIds` and `allHistoricalStaffIds`

### Phase 3: Cleanup (After Verification)

1. Remove legacy backup fields (`_legacy_*`)
2. Remove legacy array handling from all services
3. Remove fallback queries in `getChildrenByStaffIdFallback()`

---

## Code Changes Required

### 1. Step9ServiceEnrollment.jsx

```javascript
// Change state from:
const [oneOnOneServices, setOneOnOneServices] = useState([]);
const [groupClassServices, setGroupClassServices] = useState([]);

// To:
const [serviceEnrollments, setServiceEnrollments] = useState([]);
```

See implementation in: `Step9ServiceEnrollment.jsx.new`

### 2. EnrollStudentFormModal.jsx

```javascript
// Change INITIAL_STUDENT_STATE from:
{
  oneOnOneServices: [],
  groupClassServices: [],
  // ...
}

// To:
{
  serviceEnrollments: [],
  // ...
}
```

### 3. childService.js

Update `createOrUpdateChild()` to use `computeStaffIdsFromEnrollments()` instead of `extractStaffIds()`.

---

## Backward Compatibility

During transition, the following will continue to work:

1. **Staff queries** - `assignedStaffIds` is computed from new model
2. **Service display** - `ServiceEnrollmentsPanel` already uses new model
3. **Profile add/edit** - Already uses `serviceEnrollments`

Legacy data will be migrated automatically.

---

## Testing Checklist

- [ ] New enrollment creates `serviceEnrollments[]` correctly
- [ ] `assignedStaffIds` computed correctly on save
- [ ] Staff can see their assigned students
- [ ] ServiceEnrollmentsPanel displays services correctly
- [ ] Add Service from profile works
- [ ] Change Staff works with history tracking
- [ ] Deactivate/Reactivate works
- [ ] Migration converts legacy data correctly
- [ ] Frequency from Step 4 preserved in enrollments
