import { 
  collection, 
  addDoc, 
  doc, 
  getDoc,
  getDocs, 
  updateDoc, 
  deleteDoc,
  query,
  where 
} from 'firebase/firestore';
import { db } from './firebase';

class TeacherService {
  // 1. Get all teachers
  async getAllTeachers() {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'teacher'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error('Failed to fetch teachers: ' + error.message);
    }
  }

  // 2. Get teachers by specialization
  async getTeachersBySpecialization(specialization) {
    try {
      const q = query(
        collection(db, 'users'), 
        where('role', '==', 'teacher'),
        where('specializations', 'array-contains', specialization)
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error('Failed to fetch teachers by specialization: ' + error.message);
    }
  }

  // 3. Get single teacher by ID
  async getTeacherById(teacherId) {
    try {
      const teacherDoc = await getDoc(doc(db, 'users', teacherId));
      if (!teacherDoc.exists()) {
        throw new Error('Teacher not found');
      }
      return { id: teacherDoc.id, ...teacherDoc.data() };
    } catch (error) {
      throw new Error('Failed to fetch teacher: ' + error.message);
    }
  }

  // 4. Update teacher
  async updateTeacher(teacherId, updates) {
    try {
      await updateDoc(doc(db, 'users', teacherId), {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      throw new Error('Failed to update teacher: ' + error.message);
    }
  }

  // 5. Delete teacher (soft delete by changing role or hard delete)
  async deleteTeacher(teacherId) {
    try {
      // Option 1: Soft delete (change status)
      await updateDoc(doc(db, 'users', teacherId), {
        active: false,
        deletedAt: new Date().toISOString()
      });

      // Option 2: Hard delete (uncomment if needed)
      // await deleteDoc(doc(db, 'users', teacherId));
    } catch (error) {
      throw new Error('Failed to delete teacher: ' + error.message);
    }
  }

  // 6. Update teacher specializations
  async updateSpecializations(teacherId, specializations) {
    try {
      await updateDoc(doc(db, 'users', teacherId), {
        specializations: specializations,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      throw new Error('Failed to update specializations: ' + error.message);
    }
  }
}

export default new TeacherService();