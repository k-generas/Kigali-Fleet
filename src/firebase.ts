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
  setLogLevel,
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
  setLogLevel as setLiteLogLevel,
} from 'firebase/firestore/lite';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

// Suppress internal SDK transient retry/offline/token-refresh console chatter;
// genuine permission and config errors still surface via handleFirestoreError & preflight checks.
setLogLevel('silent');
setLiteLogLevel('silent');

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
const reconnectCallbacks = new Set<(mode: FirestoreTransportMode) => void>();

export function getFirestoreTransportMode(): FirestoreTransportMode {
  return transportMode;
}

export function onFirebaseReconnect(cb: (mode: FirestoreTransportMode) => void): () => void {
  reconnectCallbacks.add(cb);
  return () => {
    reconnectCallbacks.delete(cb);
  };
}

// Lightweight HTTPS preflight so we never trigger Firestore SDK network errors when offline/sleeping
export async function probeFirestoreRestReachable(timeoutMs = 3500): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return false;
  }
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/test/connection`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'x-goog-api-key': firebaseConfig.apiKey },
        signal: controller.signal,
      });
      if (res.status === 404) {
        const bodyText = await res.text().catch(() => '');
        if (bodyText.includes('does not exist') && bodyText.includes(firebaseConfig.firestoreDatabaseId)) {
          console.error(
            `Firestore database '${firebaseConfig.firestoreDatabaseId}' not found. Please check your Firebase configuration.`
          );
          return false;
        }
      }
      return res.status > 0;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return false;
  }
}

// Test connection to Firestore (Non-blocking, preflight-guarded, shuts down hanging Watch streams before 10s)
export async function testFirestoreConnection(): Promise<FirestoreTransportMode> {
  if (connectionCheckPromise) return connectionCheckPromise;

  connectionCheckPromise = (async (): Promise<FirestoreTransportMode> => {
    lastCheckedAt = Date.now();
    try {
      const reachable = await probeFirestoreRestReachable(3500);
      if (!reachable) {
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

      const restReachable = await probeFirestoreRestReachable(3000);
      if (restReachable) {
        transportMode = 'rest-only';
        return 'rest-only';
      }
      transportMode = 'offline';
      return 'offline';
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

export async function probeAuthRestReachable(timeoutMs = 3000): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return false;
  }
  try {
    const url = `https://identitytoolkit.googleapis.com/v1/projects?key=${encodeURIComponent(firebaseConfig.apiKey)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });
      return res.status > 0;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return false;
  }
}

export async function diagnoseAuthNetworkError(): Promise<string> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return 'Your device appears to be offline. Reconnect to the internet and try again, or use the Free Demo Sandbox below.';
  }
  const reachable = await probeAuthRestReachable(2800);
  if (!reachable) {
    return 'Could not reach Firebase Authentication (identitytoolkit.googleapis.com) from your browser. Check your internet connection, VPN, firewall, or disable ad/tracking blockers for this site, then try again — or explore the Free Demo Sandbox.';
  }
  return 'Connection to Firebase Authentication was interrupted. Please try again.';
}

export async function withAuthRetry<T>(
  operation: () => Promise<T>,
  options?: { onDuplicateAfterRetry?: () => Promise<T>; delayMs?: number }
): Promise<T> {
  try {
    return await operation();
  } catch (err: any) {
    if (err?.code !== 'auth/network-request-failed') {
      throw err;
    }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      throw err;
    }
    await new Promise((resolve) => setTimeout(resolve, options?.delayMs ?? 600));
    try {
      return await operation();
    } catch (retryErr: any) {
      if (retryErr?.code === 'auth/email-already-in-use' && options?.onDuplicateAfterRetry) {
        return await options.onDuplicateAfterRetry();
      }
      throw retryErr;
    }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('offline', () => {
    networkDisabled = true;
    transportMode = 'offline';
    connectionCheckPromise = Promise.resolve('offline');
    void disableNetwork(db).catch(() => {});
  });

  window.addEventListener('online', () => {
    void ensureFirestoreStreaming(true).then((mode) => {
      if (mode !== 'offline') {
        reconnectCallbacks.forEach((cb) => {
          try {
            cb(mode);
          } catch {
            // ignore listener error
          }
        });
      }
    });
  });
}

void testFirestoreConnection();
