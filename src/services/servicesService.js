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
import { db } from '../config/firebase';

class ServiceService {
  // 1. Create new service
  async createService(serviceData) {
    try {
      // Ensure type is enforced
      const validTypes = ['Therapy', 'Class'];
      const type = validTypes.includes(serviceData.type) ? serviceData.type : 'Therapy';

      const serviceRef = await addDoc(collection(db, 'services'), {
        ...serviceData,
        type, // 'Therapy' or 'Class'
        createdAt: new Date().toISOString(),
        active: true
      });
      return serviceRef.id;
    } catch (error) {
      throw new Error('Failed to create service: ' + error.message);
    }
  }

  // 2. Get all services
  async getAllServices() {
    try {
      const querySnapshot = await getDocs(collection(db, 'services'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error('Failed to fetch services: ' + error.message);
    }
  }

  // 3. Get active services only
  async getActiveServices() {
    try {
      const q = query(collection(db, 'services'), where('active', '==', true));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error('Failed to fetch active services: ' + error.message);
    }
  }

  // 4. Get services by Type (Therapy vs Class)
  async getServicesByType(type) {
    try {
      const q = query(
        collection(db, 'services'), 
        where('active', '==', true),
        where('type', '==', type)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error(`Failed to fetch ${type} services: ` + error.message);
    }
  }

  // 5. Get single service by ID
  async getServiceById(serviceId) {
    try {
      const serviceDoc = await getDoc(doc(db, 'services', serviceId));
      if (!serviceDoc.exists()) {
        throw new Error('Service not found');
      }
      return { id: serviceDoc.id, ...serviceDoc.data() };
    } catch (error) {
      throw new Error('Failed to fetch service: ' + error.message);
    }
  }

  // 6. Update service
  async updateService(serviceId, updates) {
    try {
      await updateDoc(doc(db, 'services', serviceId), {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      throw new Error('Failed to update service: ' + error.message);
    }
  }

  // 7. Deactivate service
  async deactivateService(serviceId) {
    try {
      await updateDoc(doc(db, 'services', serviceId), {
        active: false,
        deactivatedAt: new Date().toISOString()
      });
    } catch (error) {
      throw new Error('Failed to deactivate service: ' + error.message);
    }
  }

  // 8. Delete service
  async deleteService(serviceId) {
    try {
      await deleteDoc(doc(db, 'services', serviceId));
    } catch (error) {
      throw new Error('Failed to delete service: ' + error.message);
    }
  }

  // 9. Get services with enrolled children count
  async getServicesWithStats() {
    try {
      const services = await this.getAllServices();
      
      // Get all children to count enrollments
      const childrenSnapshot = await getDocs(collection(db, 'children'));
      const children = childrenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Add stats to each service
      return services.map(service => {
        const enrolledChildren = children.filter(child => 
          child.services && child.services.some(s => s.serviceName === service.name)
        );

        return {
          ...service,
          enrolledCount: enrolledChildren.length,
          enrolledChildren: enrolledChildren
        };
      });
    } catch (error) {
      throw new Error('Failed to fetch services with stats: ' + error.message);
    }
  }
}

const serviceServiceInstance = new ServiceService();
export default serviceServiceInstance;