import { db } from "../../../../config/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

const readService = {
  async getTherapyServices() {
    const q = query(collection(db, "services"), where("type", "==", "Therapy"));

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
    }));
  },
};

export default readService;
