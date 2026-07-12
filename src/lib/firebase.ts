import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, setLogLevel, doc, getDoc, setDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Suppress Firestore internal connection warnings in logs
setLogLevel('silent');

export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
  experimentalForceLongPolling: true
}, firebaseConfig.firestoreDatabaseId);

/**
 * Uploads a file to Firestore as chunks to support unlimited file sizes (up to 5MB / 20MB)
 * without needing Firebase Storage, which may not be provisioned/active.
 */
export async function uploadFileAsChunks(
  file: File | Blob,
  fileName: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  if (onProgress) {
    onProgress(1); // Immediate indicator that processing has started
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        if (typeof event.target?.result !== 'string') {
          reject(new Error('Fehler bei der Dateiverarbeitung (FileReader result is not a string)'));
          return;
        }
        
        const dataUrl = event.target.result;
        const totalLength = dataUrl.length;
        
        // Use chunks of 150,000 characters (~150 KB) to ensure reliable delivery and frequent progress updates
        const chunkSize = 150000;
        const chunks: string[] = [];
        for (let i = 0; i < totalLength; i += chunkSize) {
          chunks.push(dataUrl.substring(i, i + chunkSize));
        }
        
        const assetId = `asset_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        
        if (onProgress) {
          onProgress(5); // Progress after chunking completes
        }

        // Save metadata
        await setDoc(doc(db, 'landing_page_chunks', assetId), {
          totalChunks: chunks.length,
          filename: fileName,
          mimeType: file.type,
          updatedAt: new Date().toISOString()
        });
        
        if (onProgress) {
          onProgress(10); // Progress after metadata is written
        }

        // Save individual chunks and update progress
        let completedChunks = 0;
        for (let i = 0; i < chunks.length; i++) {
          await setDoc(doc(db, 'landing_page_chunks', `${assetId}_chunk_${i}`), {
            chunk: chunks[i]
          });
          completedChunks++;
          if (onProgress) {
            // Map the remaining progress from 10% to 100%
            const percent = 10 + Math.round((completedChunks / chunks.length) * 90);
            onProgress(percent > 100 ? 100 : percent);
          }
        }
        
        resolve(`chunked://${assetId}`);
      } catch (err) {
        reject(err);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Datei konnte nicht gelesen werden.'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Helper to upload any file/blob directly and track progress.
 * Kept identical signature for seamless drop-in replacement across all components.
 */
export async function uploadFileToStorage(
  file: Blob | File,
  _folderPath: string,
  fileName: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  return uploadFileAsChunks(file, fileName, onProgress);
}

/**
 * Reconstructs a chunked string from Firestore chunks.
 */
export async function reconstructChunkedString(chunkedUrl: string): Promise<string> {
  if (!chunkedUrl.startsWith('chunked://')) {
    return chunkedUrl;
  }
  
  const assetId = chunkedUrl.replace('chunked://', '');
  const metaSnap = await getDoc(doc(db, 'landing_page_chunks', assetId));
  
  if (!metaSnap.exists()) {
    throw new Error(`Chunk metadata not found for ${assetId}`);
  }
  
  const { totalChunks } = metaSnap.data();
  if (typeof totalChunks !== 'number' || totalChunks <= 0) {
    throw new Error(`Invalid chunk count for ${assetId}`);
  }
  
  const chunkPromises = [];
  for (let i = 0; i < totalChunks; i++) {
    chunkPromises.push(getDoc(doc(db, 'landing_page_chunks', `${assetId}_chunk_${i}`)));
  }
  
  const chunkSnaps = await Promise.all(chunkPromises);
  let fullDataUrl = '';
  for (const snap of chunkSnaps) {
    if (snap.exists()) {
      fullDataUrl += snap.data().chunk || '';
    }
  }
  
  return fullDataUrl;
}

/**
 * Recursively scans an object or array and reconstructs all chunked URL strings starting with "chunked://"
 */
export async function reconstructAllChunkedFieldsInObject<T>(obj: T): Promise<T> {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    const newArr = [];
    for (const item of obj) {
      newArr.push(await reconstructAllChunkedFieldsInObject(item));
    }
    return newArr as any;
  }
  
  const newObj = {} as any;
  for (const key of Object.keys(obj)) {
    const value = (obj as any)[key];
    if (typeof value === 'string' && value.startsWith('chunked://')) {
      // Skip the old hardcoded rule identifiers to prevent infinite loops or collisions
      if (value === 'chunked://onepager' || value === 'chunked://footerpdf') {
        newObj[key] = value;
        continue;
      }
      try {
        newObj[key] = await reconstructChunkedString(value);
      } catch (err) {
        console.error(`Failed to reconstruct chunked field at key: ${key}`, err);
        newObj[key] = value; // Keep fallback
      }
    } else if (value && typeof value === 'object') {
      newObj[key] = await reconstructAllChunkedFieldsInObject(value);
    } else {
      newObj[key] = value;
    }
  }
  
  return newObj;
}

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
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function isQuotaError(err: unknown): boolean {
  if (!err) return false;
  const errMsg = String(err instanceof Error ? err.message : err).toLowerCase();
  const errCode = (err as any)?.code || '';
  return (
    errCode === 'resource-exhausted' ||
    errCode === 'quota-exceeded' ||
    errCode === 'rate-exceeded' ||
    errMsg.includes('quota') ||
    errMsg.includes('limit exceeded') ||
    errMsg.includes('exhausted') ||
    errMsg.includes('rate exceeded') ||
    errMsg.includes('rate limit')
  );
}

export function isOfflineError(err: unknown): boolean {
  if (!err) return false;
  const errMsg = String(err instanceof Error ? err.message : err).toLowerCase();
  const errCode = (err as any)?.code || '';
  return (
    errMsg.includes('offline') ||
    errMsg.includes('unavailable') ||
    errCode === 'unavailable' ||
    errMsg.includes('timeout')
  );
}

export function logSafeFirebaseError(contextMessage: string, err: any) {
  if (isQuotaError(err)) {
    console.warn(`${contextMessage}: Firebase is currently in read-only local fallback mode due to server limits.`);
  } else if (isOfflineError(err)) {
    console.warn(`${contextMessage}: Firebase connection unavailable (offline/timeout).`);
  } else {
    console.error(contextMessage, err);
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  if (isQuotaError(error)) {
    console.warn('Firebase Error (Quota): Firebase database is currently in read-only local fallback mode due to server limits.');
    throw error;
  }
  if (isOfflineError(error)) {
    console.warn('Firebase Error (Offline): Unable to reach the database.');
    throw error;
  }
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default app;
