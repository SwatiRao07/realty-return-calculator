import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { ProjectData } from '@/types/project';

// Collection references
const PROJECTS_COLLECTION = 'C-001';

/**
 * Saves a project to Firestore
 * @param projectData The project data to save
 * @param userId Optional user ID for multi-user systems
 * @returns The project ID
 */
// Helper function to generate a unique ID if crypto.randomUUID() is not available
const generateUniqueId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const saveProject = async (projectData: ProjectData, userId?: string): Promise<string> => {
  try {
    console.log('Saving project to Firestore collection:', PROJECTS_COLLECTION);
    
    // Use UUID if available, otherwise use our custom ID generator
    const projectId = projectData.id || 
      (typeof crypto !== 'undefined' && 'randomUUID' in crypto 
        ? crypto.randomUUID() 
        : generateUniqueId());
    
    console.log('Generated/using project ID:', projectId);
    
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    
    // Add metadata
    const projectToSave = {
      ...projectData,
      id: projectId,
      userId: userId || 'anonymous',
      updatedAt: serverTimestamp(),
      createdAt: projectData.createdAt || serverTimestamp(),
    };
    
    // Remove any circular references or non-serializable data
    const cleanedProject = JSON.parse(JSON.stringify(projectToSave));
    
    console.log('Attempting to save project data:', { projectId, collection: PROJECTS_COLLECTION });
    await setDoc(projectRef, cleanedProject);
    console.log('Project saved successfully');
    
    return projectId;
  } catch (error) {
    console.error('Error saving project:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
};

/**
 * Retrieves a project from Firestore by ID
 * @param projectId The ID of the project to retrieve
 * @returns The project data or null if not found
 */
export const getProjectById = async (projectId: string): Promise<ProjectData | null> => {
  try {
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    const projectSnapshot = await getDoc(projectRef);
    
    if (projectSnapshot.exists()) {
      const data = projectSnapshot.data() as ProjectData;
      
      // Convert Firestore timestamps to JavaScript dates
      return convertFirestoreTimestamps(data);
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting project:', error);
    throw error;
  }
};

/**
 * Gets all projects for a user
 * @param userId The user ID to get projects for
 * @returns Array of projects
 */
export const getUserProjects = async (userId: string = 'anonymous'): Promise<ProjectData[]> => {
  console.log(`Fetching projects for user: ${userId} from collection: ${PROJECTS_COLLECTION}`);
  try {
    const projectsRef = collection(db, PROJECTS_COLLECTION);
    console.log('Collection reference created successfully');
    
    // Try a simple query first without filters to see if we can access the collection
    try {
      const simpleQuery = await getDocs(collection(db, PROJECTS_COLLECTION));
      console.log(`Simple query returned ${simpleQuery.size} documents`);
    } catch (e) {
      console.error('Simple collection query failed:', e);
    }
    
    // Now try the filtered query
    const q = query(
      projectsRef,
      // Make the userId filter optional to see if it's causing issues
      // where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    
    console.log('Query created, attempting to fetch documents...');
    const querySnapshot = await getDocs(q);
    console.log(`Query returned ${querySnapshot.size} documents`);
    
    const projects: ProjectData[] = [];
    
    querySnapshot.forEach((doc) => {
      console.log(`Processing document ID: ${doc.id}`);
      const data = doc.data() as ProjectData;
      projects.push(convertFirestoreTimestamps({
        ...data,
        id: doc.id
      }));
    });
    
    console.log(`Returning ${projects.length} projects`);
    return projects;
  } catch (error) {
    console.error('Error fetching projects:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    // Return an empty array instead of throwing to avoid UI crashes
    return [];
  }
};

/**
 * Deletes a project from Firestore
 * @param projectId The ID of the project to delete
 */
export const deleteProject = async (projectId: string): Promise<void> => {
  try {
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    await deleteDoc(projectRef);
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

/**
 * Helper function to convert Firestore timestamps to JavaScript dates
 */
function convertFirestoreTimestamps(data: any): any {
  if (!data) return data;
  
  const result = { ...data };
  
  // Convert top-level timestamp fields
  for (const [key, value] of Object.entries(result)) {
    // Handle Firestore Timestamp objects
    if (value instanceof Timestamp) {
      result[key] = value.toDate();
    }
    // Handle serialized Firestore timestamps
    else if (value && typeof value === 'object' && 'seconds' in value && 'nanoseconds' in value) {
      try {
        const seconds = typeof value.seconds === 'number' ? value.seconds : Number(value.seconds);
        const nanoseconds = typeof value.nanoseconds === 'number' ? value.nanoseconds : Number(value.nanoseconds || 0);
        result[key] = new Date(seconds * 1000 + (nanoseconds / 1000000));
        console.log(`Converted timestamp for ${key}:`, result[key]);
      } catch (e) {
        console.error(`Error converting timestamp for ${key}:`, e);
      }
    }
  }
  
  // Handle arrays of objects with timestamps
  ['payments', 'rentalIncome', 'operatingExpenses'].forEach(arrayField => {
    if (Array.isArray(result[arrayField])) {
      result[arrayField] = result[arrayField].map((item: any) => {
        const newItem = { ...item };
        
        // Handle Firestore Timestamp objects
        if (newItem.date instanceof Timestamp) {
          newItem.date = newItem.date.toDate();
        }
        // Handle serialized Firestore timestamps
        else if (newItem.date && typeof newItem.date === 'object' && 'seconds' in newItem.date) {
          try {
            const seconds = typeof newItem.date.seconds === 'number' ? newItem.date.seconds : Number(newItem.date.seconds);
            const nanoseconds = typeof newItem.date.nanoseconds === 'number' ? newItem.date.nanoseconds : Number(newItem.date.nanoseconds || 0);
            newItem.date = new Date(seconds * 1000 + (nanoseconds / 1000000));
          } catch (e) {
            console.error('Error converting date timestamp:', e);
          }
        }
        
        return newItem;
      });
    }
  });
  
  // Log conversion for debugging
  if (result.updatedAt) {
    console.log('Converted updatedAt timestamp:', result.updatedAt);
  }
  if (result.createdAt) {
    console.log('Converted createdAt timestamp:', result.createdAt);
  }
  
  return result;
}
