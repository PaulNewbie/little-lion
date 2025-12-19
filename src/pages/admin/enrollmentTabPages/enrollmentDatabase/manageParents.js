import { db } from "../../../../config/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";

const manageParents = {
  async createParent(parentData) {
    try {
      // Create parent document with auto-generated ID
      const docRef = await addDoc(collection(db, "users"), {
        firstName: parentData.firstName,
        middleName: parentData.middleName,
        lastName: parentData.lastName,
        email: parentData.email,
        phone: parentData.phone,
        password: parentData.password, // ⚠️ dev only
        role: "parent",
        childrenIds: [],
        mustChangePassword: true,
        createdAt: serverTimestamp(),
      });

      // Return saved parent with UID
      return {
        uid: docRef.id,
        ...parentData,
        role: "parent",
      };
    } catch (error) {
      console.error("Create parent error:", error);
      throw error;
    }
  },

  // ✅ NEW: fetch parents from Firestore
  async getParents() {
    try {
      const q = query(collection(db, "users"), where("role", "==", "parent"));

      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Fetch parents error:", error);
      throw error;
    }
  },
};

export default manageParents;
