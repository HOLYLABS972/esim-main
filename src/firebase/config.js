// Stub Firebase config for static site build
// This allows the code to compile without actual Firebase connection

// Mock Firestore functions
const mockCollection = () => ({});
const mockDoc = () => ({});
const mockGetDocs = async () => ({ docs: [], empty: true });
const mockGetDoc = async () => ({ exists: () => false, data: () => ({}) });
const mockAddDoc = async () => ({ id: 'mock-id' });
const mockUpdateDoc = async () => ({});
const mockDeleteDoc = async () => ({});
const mockQuery = (...args) => ({});
const mockWhere = () => ({});
const mockOrderBy = () => ({});
const mockLimit = () => ({});
const mockStartAfter = () => ({});
const mockServerTimestamp = () => new Date().toISOString();

// Mock Storage functions
const mockRef = () => ({});
const mockUploadBytes = async () => ({ ref: {} });
const mockGetDownloadURL = async () => '';
const mockDeleteObject = async () => ({});

// Export mock db object
export const db = {
  collection: mockCollection,
  doc: mockDoc
};

// Export mock storage object
export const storage = {
  ref: mockRef
};

// Re-export all Firestore functions as mocks for imports
export {
  mockCollection as collection,
  mockDoc as doc,
  mockGetDocs as getDocs,
  mockGetDoc as getDoc,
  mockAddDoc as addDoc,
  mockUpdateDoc as updateDoc,
  mockDeleteDoc as deleteDoc,
  mockQuery as query,
  mockWhere as where,
  mockOrderBy as orderBy,
  mockLimit as limit,
  mockStartAfter as startAfter,
  mockServerTimestamp as serverTimestamp,
  mockRef as ref,
  mockUploadBytes as uploadBytes,
  mockGetDownloadURL as getDownloadURL,
  mockDeleteObject as deleteObject
};

