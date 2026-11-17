import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  initializeFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  disableNetwork,
  enableNetwork,
  type DocumentReference,
  type DocumentData,
  type SetOptions,
} from 'firebase/firestore';
import {
  getFirestore as getLiteFirestore,
  doc as liteDoc,
  getDoc as liteGetDoc,
  setDoc as liteSetDoc,
  updateDoc as liteUpdateDoc,
  deleteDoc as liteDeleteDoc,
} from 'firebase/firestore/lite';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore using the designated firestoreDatabaseId.
// Force XHR long-polling (useFetchStreams: false) to avoid Fetch ReadableStream stalls
// inside iframe/reverse-proxy environments.
export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
    experimentalLongPollingOptions: { timeoutSeconds: 8 },
    ignoreUndefinedProperties: true,
    useFetchStreams: false,
  } as Record<string, unknown>,
  firebaseConfig.firestoreDatabaseId
);

// Lightweight REST-only Firestore instance (unary HTTPS fetch, no WebChannel Watch stream)
export const liteDb = getLiteFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Authentication & Cloud Storage
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const storage = getStorage(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export type FirestoreTransportMode = 'streaming' | 'rest-only' | 'offline';

let transportMode: FirestoreTransportMode = 'streaming';
let networkDisabled = false;
let lastCheckedAt = 0;
let connectionCheckPromise: Promise<FirestoreTransportMode> | null = null;

export function getFirestoreTransportMode(): FirestoreTransportMode {
  return transportMode;
}

// Test connection to Firestore (Non-blocking, shuts down hanging Watch streams before 10s)
export async function testFirestoreConnection(): Promise<FirestoreTransportMode> {
  if (connectionCheckPromise) return connectionCheckPromise;

  connectionCheckPromise = (async (): Promise<FirestoreTransportMode> => {
    lastCheckedAt = Date.now();
    try {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        networkDisabled = true;
        await disableNetwork(db).catch(() => {});
        transportMode = 'offline';
        return 'offline';
      }

      if (networkDisabled) {
        networkDisabled = false;
        await enableNetwork(db).catch(() => {});
      }

      let timedOut = false;
      const connectionTest = getDocFromServer(doc(db, 'test', 'connection')).catch((err) => {
        if (!timedOut && err instanceof Error && err.message.includes('the client is offline')) {
          console.warn('Firestore client offline during connection check.');
        }
        throw err;
      });

      await Promise.race([
        connectionTest,
        new Promise<never>((_, reject) =>
          setTimeout(() => {
            timedOut = true;
            reject(new Error('connection test timed out'));
          }, 4500)
        ),
      ]);

      transportMode = 'streaming';
      return 'streaming';
    } catch {
      // Abort any pending WebChannel Watch stream well before Firestore's 10s OnlineStateTracker timer fires
      networkDisabled = true;
      await disableNetwork(db).catch(() => {});

      try {
        await Promise.race([
          liteGetDoc(liteDoc(liteDb, 'test', 'connection')),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('rest timeout')), 3500)),
        ]);
        transportMode = 'rest-only';
        return 'rest-only';
      } catch {
        transportMode = 'offline';
        return 'offline';
      }
    }
  })();

  return connectionCheckPromise;
}

export async function ensureFirestoreStreaming(forceRecheck = false): Promise<FirestoreTransportMode> {
  if (connectionCheckPromise) {
    const current = await connectionCheckPromise;
    if (current === 'streaming') return 'streaming';
    if (!forceRecheck && Date.now() - lastCheckedAt < 30000) {
      return current;
    }
  }
  connectionCheckPromise = null;
  return testFirestoreConnection();
}

export async function smartGetDoc(docRef: DocumentReference<DocumentData, DocumentData>) {
  if (transportMode === 'streaming') {
    return getDoc(docRef);
  }
  return liteGetDoc(liteDoc(liteDb, docRef.path));
}

export async function smartSetDoc(
  docRef: DocumentReference<DocumentData, DocumentData>,
  data: Record<string, any>,
  options?: SetOptions
) {
  if (transportMode === 'streaming') {
    return options ? setDoc(docRef, data, options) : setDoc(docRef, data);
  }
  const target = liteDoc(liteDb, docRef.path);
  return options ? liteSetDoc(target, data, options) : liteSetDoc(target, data);
}

export async function smartUpdateDoc(
  docRef: DocumentReference<DocumentData, DocumentData>,
  data: Record<string, any>
) {
  if (transportMode === 'streaming') {
    return updateDoc(docRef, data);
  }
  return liteUpdateDoc(liteDoc(liteDb, docRef.path), data);
}

export async function smartDeleteDoc(docRef: DocumentReference<DocumentData, DocumentData>) {
  if (transportMode === 'streaming') {
    return deleteDoc(docRef);
  }
  return liteDeleteDoc(liteDoc(liteDb, docRef.path));
}

void testFirestoreConnection();
