import { db } from './firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

// Test collection name
const TEST_COLLECTION = 'firestore-test';

/**
 * Runs a simple Firestore test to verify connection
 * This adds a test document and then retrieves it
 */
export const testFirestoreConnection = async (): Promise<string> => {
  try {
    console.log('Starting Firestore connection test...');
    
    // 1. First try to write a simple test document
    const testData = {
      test: true,
      timestamp: new Date().toISOString(),
      message: 'Firestore connection test'
    };
    
    // Try to add the document
    console.log('Attempting to write test document...');
    const docRef = await addDoc(collection(db, TEST_COLLECTION), testData);
    console.log('Test document written with ID:', docRef.id);
    
    // 2. Try to read documents from the test collection
    console.log('Attempting to read from test collection...');
    const querySnapshot = await getDocs(collection(db, TEST_COLLECTION));
    const docsCount = querySnapshot.size;
    console.log(`Successfully read ${docsCount} documents from test collection`);
    
    return `Firestore connection successful! Test document ID: ${docRef.id}`;
  } catch (error) {
    console.error('Firestore test failed:', error);
    if (error instanceof Error) {
      return `Firestore test failed: ${error.message}`;
    }
    return 'Firestore test failed with unknown error';
  }
};
