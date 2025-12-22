import { db } from "../../../../config/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

const readUsers = {
  async getAllTeachersTherapists() {
    const usersRef = collection(db, "users");

    const q = query(usersRef, where("type", "in", ["Teacher", "Therapist"]));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        userId: doc.id,
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        fullName: `${data.firstName || ""} ${data.lastName || ""}`,
        role: data.role,
      };
    });
  },
};

export default readUsers;
