import { db } from "../../../../config/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

const readUsers = {
  async getAllTeachersTherapists() {
    try {
      const usersRef = collection(db, "users");

      // Query for both teachers and therapists
      const q = query(usersRef, where("role", "in", ["teacher", "therapist"]));

      const snapshot = await getDocs(q);

      const users = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          uid: doc.id, // CORRECTED: Use 'uid' consistently
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          middleName: data.middleName || "",
          fullName: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
          role: data.role,
          specializations: data.specializations || [], // CORRECTED: Ensure array exists
          email: data.email || "",
          phone: data.phone || "",
          active: data.active !== false, // Default to true if not specified
        };
      });

      console.log("Fetched staff from Firebase:", users);
      return users;
    } catch (error) {
      console.error("Error in getAllTeachersTherapists:", error);
      throw error;
    }
  },
};

export default readUsers;
