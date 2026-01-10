# Firebase Optimization Implementation Guide

## Quick Start

Follow these steps to implement all optimizations in your SPED Monitoring System.

---

## Step 1: Update Environment Variables (5 minutes)

1. Create `.env` file from template:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Firebase credentials (get from Firebase Console)

3. Add `.env` to `.gitignore`:
   ```bash
   echo ".env" >> .gitignore
   ```

4. **IMPORTANT**: Rotate your Firebase API keys since they were exposed in code
   - Go to Google Cloud Console > APIs & Services > Credentials
   - Regenerate the API key
   - Update your `.env` file with the new key

---

## Step 2: Replace Configuration Files (10 minutes)

### 2.1 Replace `src/config/firebase.js`
Copy the new `firebase.js` from this package. This adds:
- Environment variable support
- Offline persistence (Strategy 5)
- Multi-tab support

### 2.2 Create `src/config/queryClient.js`
This is a NEW file that provides:
- Aggressive caching configuration (Strategy 1)
- Consistent query keys
- Cache invalidation helpers

### 2.3 Update `src/App.jsx`
Wrap your app with the optimized QueryClientProvider.

---

## Step 3: Replace Service Files (15 minutes)

### 3.1 Replace `src/services/childService.js`
New features:
- Paginated queries (Strategy 4)
- Role-based queries (Strategy 2)
- assignedStaffIds extraction (Strategy 3)

### 3.2 Replace `src/services/userService.js`
New features:
- Combined staff query (Strategy 7)
- Staff summary metadata
- Batch operations

---

## Step 4: Add New Hook Files (10 minutes)

### 4.1 Create `src/hooks/useRoleBasedData.js`
This provides smart data loading based on user role (Strategy 6):
- `useStudents()` - automatically filters by role
- `useStaff()` - cached staff queries
- `useServices()` - static data caching
- `useDashboardData()` - combined dashboard queries
- `useStudentProfileData()` - all data for student detail view

### 4.2 Update existing hooks
Replace `useManageTeachers.js` and `useManageTherapists.js` with optimized versions.

---

## Step 5: Add Utility Files (5 minutes)

### 5.1 Create `src/utils/denormalization.js`
Helpers for keeping embedded data in sync.

### 5.2 Create `src/utils/readCounter.js` (Optional - Development)
Track Firestore reads to measure optimization impact.

---

## Step 6: Deploy Firestore Indexes (5 minutes)

```bash
# If you have Firebase CLI installed
firebase deploy --only firestore:indexes

# Or manually add indexes in Firebase Console
# Firestore > Indexes > Add Index
```

Required indexes (see `firestore.indexes.json`):
- children: parentId + lastName
- children: assignedStaffIds (array-contains) + lastName
- children: status + lastName
- users: role + lastName
- activities: childId + date
- sessions: childId + sessionDate
- sessions: staffId + sessionDate

---

## Step 7: Run Data Migration (10 minutes)

Run the one-time migration to add denormalized fields to existing documents:

```javascript
// In your browser console while logged in as admin, or create an admin page

import { runAllMigrations } from './utils/denormalization';

// Run this ONCE
await runAllMigrations();
```

Or create a migration button in your admin panel:

```jsx
// In ManageAdmins.jsx or a dedicated admin page
import { runAllMigrations } from '../../utils/denormalization';

const handleMigration = async () => {
  if (window.confirm('Run data migration? This may take a minute.')) {
    const results = await runAllMigrations();
    alert(`Migration complete!\n${JSON.stringify(results, null, 2)}`);
  }
};

// Add button in your admin UI
<button onClick={handleMigration}>Run Data Migration</button>
```

---

## Step 8: Update Components to Use New Hooks (30 minutes)

### Before (old pattern):
```jsx
import { useQuery } from '@tanstack/react-query';
import childService from '../services/childService';

function StudentList() {
  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => childService.getAllChildren(), // ❌ Fetches ALL
    staleTime: 1000 * 60 * 5,
  });
  
  return <div>{students.map(s => <Card key={s.id} student={s} />)}</div>;
}
```

### After (optimized pattern):
```jsx
import { useStudents } from '../hooks/useRoleBasedData';

function StudentList() {
  const { data, isLoading } = useStudents(); // ✅ Role-aware, paginated
  const students = data?.students || data || [];
  
  if (isLoading) return <Loading />;
  
  return <div>{students.map(s => <Card key={s.id} student={s} />)}</div>;
}
```

### Components to Update:

| Component | Old Hook/Query | New Hook |
|-----------|---------------|----------|
| StudentProfile.jsx | useQuery(['students']) | useStudents() |
| OneOnOne.jsx | useQuery(['students']) | useStudents() |
| PlayGroup.jsx | useQuery(['students']) | useStudents() |
| ManageTeachers.jsx | useQuery(['teachers']) | useTeachers() |
| ManageTherapists.jsx | useQuery(['therapists']) | useTherapists() |
| EnrollStudent.jsx | childService.getAllChildren() | useStudents({ forceAll: true }) |
| Step9ServiceEnrollment.jsx | useQuery(['staff']) | useStaff() |

---

## Step 9: Verify Optimizations (15 minutes)

### Enable Read Counter
In development, the read counter overlay shows real-time Firestore reads.

### Test Scenarios

| Scenario | Before | After Target |
|----------|--------|--------------|
| Admin loads student list | 100+ reads | 20 reads (paginated) |
| Admin navigates away and back | 100+ reads | 0 reads (cached) |
| Parent views dashboard | 50+ reads | 3-5 reads |
| Teacher views assigned students | 50+ reads | 5-15 reads |
| Opening same page in new tab | Full refetch | From IndexedDB |

### Check Offline Mode
1. Load a page with data
2. Go to Chrome DevTools > Network > Offline
3. Navigate to another page you've visited
4. Data should still load from IndexedDB cache

---

## File Checklist

```
src/
├── config/
│   ├── firebase.js          ✅ Updated (offline persistence)
│   └── queryClient.js        ✅ NEW (aggressive caching)
│
├── services/
│   ├── childService.js       ✅ Updated (pagination, role queries)
│   └── userService.js        ✅ Updated (combined queries, metadata)
│
├── hooks/
│   ├── useRoleBasedData.js   ✅ NEW (smart data loading)
│   ├── useManageTeachers.js  ✅ Updated (uses new hooks)
│   └── useManageTherapists.js ✅ Updated (uses new hooks)
│
├── utils/
│   ├── denormalization.js    ✅ NEW (data sync helpers)
│   └── readCounter.js        ✅ NEW (development monitoring)
│
├── App.jsx                   ✅ Updated (QueryClientProvider)
│
.env.example                  ✅ NEW (environment template)
.env                          ⬜ Create from template
firestore.indexes.json        ✅ NEW (required indexes)
```

---

## Estimated Impact

### Daily Read Reduction

| User Type | Before | After | Savings |
|-----------|--------|-------|---------|
| Admin (heavy use) | 5,000 reads | 500 reads | 90% |
| Teacher (moderate) | 2,000 reads | 300 reads | 85% |
| Parent (light) | 500 reads | 50 reads | 90% |

### With 10 Active Users Daily
- **Before**: ~30,000 reads/day (could exceed free tier)
- **After**: ~3,000 reads/day (well within free tier)

### Free Tier Limits (Spark Plan)
- 50,000 reads/day
- 20,000 writes/day
- 20,000 deletes/day

With optimizations, you could support **100+ daily active users** on the free tier!

---

## Troubleshooting

### "Index required" errors
Deploy the indexes from `firestore.indexes.json` or create them manually in Firebase Console.

### Data not updating after changes
Call `invalidateRelatedCaches('entityType')` after mutations:
```javascript
import { invalidateRelatedCaches } from '../config/queryClient';

// After saving a student
await invalidateRelatedCaches('student', studentId);
```

### Stale data showing
For truly real-time needs, reduce staleTime for specific queries:
```javascript
const { data } = useQuery({
  queryKey: ['sessions', 'today'],
  queryFn: fetchTodaySessions,
  staleTime: 1000 * 30, // 30 seconds for near-real-time
});
```

### Offline mode not working
Check browser console for persistence errors. Some browsers (especially in private mode) don't support IndexedDB.

---

## Next Steps

After implementing these optimizations:

1. **Monitor for 1 week** - Watch the read counter and Firebase usage dashboard
2. **Adjust cache times** - If data feels stale, reduce staleTime for specific queries
3. **Consider metadata collections** - For dashboards, pre-compute aggregations
4. **Set up backup script** - See backup-strategy-guide.md
5. **Implement security rules** - The optimizations don't fix security issues!

---

## Questions?

Common issues and solutions:

**Q: My data isn't updating after I save**
A: Make sure to call `invalidateRelatedCaches()` after mutations

**Q: The pagination "Load More" isn't working**
A: Check that you're passing the `lastDoc` correctly from the previous query result

**Q: Offline mode doesn't work in Safari**
A: Safari has limited IndexedDB support; it should still work but with smaller cache size

**Q: Some queries are still slow**
A: Check if the required Firestore index exists; missing indexes cause full collection scans
