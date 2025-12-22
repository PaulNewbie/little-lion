import { db } from "../../../../config/firebase";
import { collection, getDocs } from "firebase/firestore";

const readServices = {
  async getAllServices() {
    const snapshot = await getDocs(collection(db, "services"));

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
      type: doc.data().type,
    }));
  },
};

export default readServices;
