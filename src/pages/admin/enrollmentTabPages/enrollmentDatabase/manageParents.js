import { db } from "../../../../config/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const manageParents = {
  async createParent(parentData) {
    try {
      // Create parent document with auto-generated ID
      const docRef = await addDoc(collection(db, "users"), {
        firstName: parentData.firstName,
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
};

export default manageParents;
