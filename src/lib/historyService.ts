import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp, 
  Timestamp,
  updateDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { HistoryOperation, HistorySession, OperationType, OperationMetadata } from '@/types/history';
import { ProjectData } from '@/types/project';

// Collection references
const HISTORY_SESSIONS_COLLECTION = 'history-sessions';
const OPERATIONS_COLLECTION = 'history-operations';

// Helper function to generate a unique ID
const generateUniqueId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

/**
 * Start a new history session
 */
export const startHistorySession = async (projectId?: string, projectName?: string): Promise<HistorySession> => {
  try {
    console.log('Starting new history session with:', { projectId, projectName });
    
    const sessionId = generateUniqueId();
    const currentTime = new Date();
    
    // Create session object with JS Date for local use
    const newSession: HistorySession = {
      id: sessionId,
      startTime: currentTime,
      operations: [],
      projectId,
      projectName,
      isActive: true
    };
    
    // Create a clean version for Firestore (serverTimestamp will be properly handled)
    const firestoreSession = {
      id: sessionId,
      startTime: serverTimestamp(),
      operations: [],
      projectId: projectId || null,
      projectName: projectName || 'Unnamed Session',
      isActive: true
    };
    
    // Clean any undefined values
    const cleanedSession = JSON.parse(JSON.stringify(firestoreSession));
    
    console.log('Saving session to Firestore with ID:', sessionId);
    
    // Save to Firestore
    await setDoc(doc(db, HISTORY_SESSIONS_COLLECTION, sessionId), cleanedSession);
    
    console.log('History session created successfully');
    
    return newSession;
  } catch (error) {
    console.error('Error starting history session:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
};

/**
 * End a history session
 */
export const endHistorySession = async (sessionId: string): Promise<void> => {
  try {
    const sessionRef = doc(db, HISTORY_SESSIONS_COLLECTION, sessionId);
    
    await updateDoc(sessionRef, {
      endTime: serverTimestamp(),
      isActive: false
    });
  } catch (error) {
    console.error('Error ending history session:', error);
    throw error;
  }
};

/**
 * Add an operation to the history
 */
export const recordOperation = async (
  sessionId: string,
  type: OperationType,
  metadata: OperationMetadata,
  projectSnapshot?: Partial<ProjectData>
): Promise<HistoryOperation> => {
  try {
    console.log('Recording operation:', { sessionId, type });
    
    const operationId = generateUniqueId();
    const currentTime = new Date();
    
    // Create metadata with current timestamp for local use
    const localMetadata = {
      ...metadata,
      timestamp: currentTime
    };
    
    // Clean the project snapshot to avoid circular refs
    const cleanSnapshot = projectSnapshot ? JSON.parse(JSON.stringify(projectSnapshot)) : undefined;
    
    // Create operation object for local use
    const operation: HistoryOperation = {
      id: operationId,
      type,
      metadata: localMetadata,
      projectSnapshot: cleanSnapshot
    };
    
    // Create a separate object for Firestore with serverTimestamp
    const firestoreOperation = {
      id: operationId,
      type,
      metadata: {
        ...metadata,
        timestamp: serverTimestamp()
      },
      projectSnapshot: cleanSnapshot,
      sessionId // Add sessionId for querying
    };
    
    // Clean any undefined values or circular references
    const cleanedOperation = JSON.parse(JSON.stringify(firestoreOperation));
    
    console.log('Saving operation to Firestore with ID:', operationId);
    
    // Save to Firestore
    await setDoc(doc(db, OPERATIONS_COLLECTION, operationId), cleanedOperation);
    
    console.log('Operation recorded successfully');
    
    return operation;
  } catch (error) {
    console.error('Error recording operation:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
};

/**
 * Get all history sessions
 */
export const getHistorySessions = async (): Promise<HistorySession[]> => {
  try {
    const q = query(
      collection(db, HISTORY_SESSIONS_COLLECTION),
      orderBy('startTime', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const sessions: HistorySession[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as HistorySession;
      sessions.push(convertFirestoreTimestamps(data));
    });
    
    return sessions;
  } catch (error) {
    console.error('Error getting history sessions:', error);
    throw error;
  }
};

/**
 * Get operations for a session
 */
export const getSessionOperations = async (sessionId: string): Promise<HistoryOperation[]> => {
  try {
    const q = query(
      collection(db, OPERATIONS_COLLECTION),
      where('sessionId', '==', sessionId),
      orderBy('metadata.timestamp', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const operations: HistoryOperation[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as HistoryOperation & { sessionId: string };
      const { sessionId, ...operationData } = data;
      operations.push(convertFirestoreTimestamps(operationData));
    });
    
    return operations;
  } catch (error) {
    console.error('Error getting session operations:', error);
    throw error;
  }
};

/**
 * Get recent operations across all sessions
 */
export const getRecentOperations = async (count: number = 20): Promise<HistoryOperation[]> => {
  try {
    const q = query(
      collection(db, OPERATIONS_COLLECTION),
      orderBy('metadata.timestamp', 'desc'),
      limit(count)
    );
    
    const querySnapshot = await getDocs(q);
    const operations: HistoryOperation[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as HistoryOperation;
      operations.push(convertFirestoreTimestamps(data));
    });
    
    return operations;
  } catch (error) {
    console.error('Error getting recent operations:', error);
    throw error;
  }
};

/**
 * Helper function to convert Firestore timestamps to JavaScript dates
 */
function convertFirestoreTimestamps<T>(data: T): T {
  if (!data) return data;
  
  const result = { ...data } as any;
  
  // Convert top-level timestamp fields
  for (const [key, value] of Object.entries(result)) {
    if (value instanceof Timestamp) {
      result[key] = value.toDate();
    } else if (value && typeof value === 'object') {
      // Recursively convert nested objects
      result[key] = convertFirestoreTimestamps(value);
    }
  }
  
  return result as T;
}
