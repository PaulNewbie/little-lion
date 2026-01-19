import { collection, getDocs, query, where, writeBatch, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * One-time migration to add permissions to existing staff
 * Run this once after deploying the permission system
 */
export async function migrateExistingStaffPermissions() {
  const batch = writeBatch(db);
  let count = 0;

  // Get all staff (teachers, therapists, admins)
  const q = query(
    collection(db, 'users'),
    where('role', 'in', ['teacher', 'therapist', 'admin'])
  );

  const snapshot = await getDocs(q);

  snapshot.docs.forEach(docSnap => {
    const userData = docSnap.data();
    
    // Skip if already has permissions object
    if (userData.permissions) {
      console.log(`Skipping ${userData.email} - already has permissions`);
      return;
    }

    const userRef = doc(db, 'users', docSnap.id);
    batch.update(userRef, {
      permissions: {
        canEnrollStudents: true  // Grant existing staff to preserve access
      },
      permissionsHistory: [{
        permission: 'canEnrollStudents',
        value: true,
        changedBy: 'SYSTEM_MIGRATION',
        changedAt: new Date().toISOString(),
        reason: 'Migration: Preserved existing enrollment access'
      }]
    });
    count++;
  });

  if (count > 0) {
    await batch.commit();
    console.log(`Migration complete: Updated ${count} users`);
  } else {
    console.log('No users needed migration');
  }

  return { migratedCount: count };
}