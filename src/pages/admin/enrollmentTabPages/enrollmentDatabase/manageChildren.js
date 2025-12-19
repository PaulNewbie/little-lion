// manageChildren.js
import { db } from "../../../../config/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
} from "firebase/firestore";

const manageChildren = {
  // Create a new child document linked to a parent
  async createChild(parentId, childData) {
    try {
      const docRef = await addDoc(collection(db, "children"), {
        parentId, // link to parent
        ...childData,
        status: childData.status || "ENROLLED",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return {
        id: docRef.id,
        parentId,
        ...childData,
      };
    } catch (error) {
      console.error("Create child error:", error);
      throw error;
    }
  },

  // Fetch children by parentId
  async getChildrenByParent(parentId) {
    try {
      const q = query(
        collection(db, "children"),
        where("parentId", "==", parentId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Fetch children error:", error);
      throw error;
    }
  },

  // Fetch all children
  async getAllChildren() {
    try {
      const snapshot = await getDocs(collection(db, "children"));
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Fetch all children error:", error);
      throw error;
    }
  },
};

export default manageChildren;
