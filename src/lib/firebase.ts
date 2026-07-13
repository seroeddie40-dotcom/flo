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

// Shared local in-memory cache to dynamically resolve "chunked://" URLs synchronously for images/videos/etc.
export const chunkedUrlsCache: Record<string, string> = {};

// Shared local in-memory cache for Blob URLs to avoid re-creating them and leaking memory
export const objectUrlCache: Record<string, string> = {};

function dataURItoBlob(dataURI: string): Blob {
  const commaIndex = dataURI.indexOf(',');
  if (commaIndex === -1) {
    throw new Error('Invalid data URI format');
  }
  const header = dataURI.substring(0, commaIndex);
  const data = dataURI.substring(commaIndex + 1);
  
  let byteString;
  if (header.indexOf('base64') >= 0) {
    byteString = atob(data);
  } else {
    byteString = decodeURIComponent(data);
  }

  const mimeMatch = header.match(/:(.*?);/);
  const mimeString = mimeMatch ? mimeMatch[1] : 'application/octet-stream';

  const ia = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ia], { type: mimeString });
}

export function resolveChunkedUrl(url: string | undefined, forceType?: 'video' | 'image' | 'pdf'): string | undefined {
  if (!url) return url;
  
  let resolved: string = url;
  if (url.startsWith('chunked://')) {
    resolved = chunkedUrlsCache[url] || url;
  }
  
  if (resolved && resolved.startsWith('data:')) {
    const isVideo = forceType === 'video' || resolved.startsWith('data:video/') || resolved.includes('video/quicktime') || resolved.includes('video/mp4') || resolved.includes('video/webm') || resolved.includes('video/ogg');
    const isPdf = forceType === 'pdf' || resolved.startsWith('data:application/pdf');
    if (isVideo || isPdf) {
      if (objectUrlCache[resolved]) {
        return objectUrlCache[resolved];
      }
      try {
        const blob = dataURItoBlob(resolved);
        const objectUrl = URL.createObjectURL(blob);
        objectUrlCache[resolved] = objectUrl;
        return objectUrl;
      } catch (e) {
        console.error('Error converting base64 to Blob Object URL:', e);
        return resolved;
      }
    }
  }
  
  return resolved;
}

/**
 * Uploads a file to Firestore as chunks to support unlimited file sizes (up to 5MB / 25MB)
 * without needing Firebase Storage, which may not be provisioned/active.
 */
export async function uploadFileAsChunks(
  file: File | Blob,
  fileName: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  let displayProgress = 0;
  let uploadFinished = false;

  const updateProgress = (target: number) => {
    if (!onProgress) return;
    if (target > displayProgress) {
      displayProgress = Math.min(100, Math.round(target));
      onProgress(displayProgress);
    }
  };

  updateProgress(1);

  // Smooth visual progress driver to prevent the indicator from freezing
  const progressTimer = setInterval(() => {
    if (uploadFinished) return;
    // Slow down as we approach 95%
    if (displayProgress < 15) {
      updateProgress(displayProgress + 2);
    } else if (displayProgress < 60) {
      updateProgress(displayProgress + 1);
    } else if (displayProgress < 95) {
      updateProgress(displayProgress + 0.5);
    }
  }, 100);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        if (typeof event.target?.result !== 'string') {
          clearInterval(progressTimer);
          reject(new Error('Fehler bei der Dateiverarbeitung (FileReader result is not a string)'));
          return;
        }
        
        const dataUrl = event.target.result;
        const totalLength = dataUrl.length;
        
        // Use chunks of 800,000 characters (~800 KB) instead of 150,000 characters
        // This is still safely under the 1MB Firestore document limit and reduces network writes by 5.3x
        const chunkSize = 800000;
        const chunks: string[] = [];
        for (let i = 0; i < totalLength; i += chunkSize) {
          chunks.push(dataUrl.substring(i, i + chunkSize));
        }
        
        const assetId = `asset_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        
        updateProgress(15);

        const withTimeoutLocal = <T>(promise: Promise<T>, ms: number): Promise<T> => {
          return Promise.race([
            promise,
            new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
          ]);
        };

        try {
          // Use a tighter 15-second timeout for metadata so we don't leave the user hanging if offline
          await withTimeoutLocal(
            setDoc(doc(db, 'landing_page_chunks', assetId), {
              totalChunks: chunks.length,
              filename: fileName,
              mimeType: file.type,
              updatedAt: new Date().toISOString()
            }),
            15000
          );
        } catch (metadataErr) {
          console.warn('Firebase upload failed or timed out. Falling back to local Base64 storage:', metadataErr);
          uploadFinished = true;
          clearInterval(progressTimer);
          if (onProgress) {
            onProgress(100);
          }
          resolve(dataUrl);
          return;
        }
        
        updateProgress(20);

        // Save individual chunks in parallel to drastically improve speed and reliability
        let completedChunks = 0;
        try {
          const chunkPromises = chunks.map(async (chunk, i) => {
            await withTimeoutLocal(
              setDoc(doc(db, 'landing_page_chunks', `${assetId}_chunk_${i}`), {
                chunk: chunk
              }),
              30000 // Generous 30 second timeout per chunk for slower connections
            );
            completedChunks++;
            const realPercent = 20 + Math.round((completedChunks / chunks.length) * 78);
            updateProgress(realPercent);
          });
          
          await Promise.all(chunkPromises);
        } catch (chunkErr) {
          console.warn('Firebase chunk upload failed or timed out. Falling back to local Base64 storage:', chunkErr);
          uploadFinished = true;
          clearInterval(progressTimer);
          if (onProgress) {
            onProgress(100);
          }
          resolve(dataUrl);
          return;
        }
        
        uploadFinished = true;
        clearInterval(progressTimer);
        updateProgress(100);
        
        chunkedUrlsCache[`chunked://${assetId}`] = dataUrl;
        try {
          if (dataUrl.length < 1500000) {
            localStorage.setItem(`cache_chunked://${assetId}`, dataUrl);
          }
        } catch (e) {
          // Ignore localStorage quota errors
        }
        resolve(`chunked://${assetId}`);
      } catch (err) {
        uploadFinished = true;
        clearInterval(progressTimer);
        reject(err);
      }
    };
    
    reader.onerror = () => {
      uploadFinished = true;
      clearInterval(progressTimer);
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

async function getDocWithRetry(docRef: any, maxRetries = 3, timeoutMs = 15000): Promise<any> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await Promise.race([
        getDoc(docRef),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs))
      ]);
    } catch (err) {
      attempt++;
      if (attempt >= maxRetries) {
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, 300 * attempt));
    }
  }
}

/**
 * Reconstructs a chunked string from Firestore chunks.
 */
export async function reconstructChunkedString(chunkedUrl: string): Promise<string> {
  if (!chunkedUrl.startsWith('chunked://')) {
    return chunkedUrl;
  }
  
  if (chunkedUrlsCache[chunkedUrl]) {
    return chunkedUrlsCache[chunkedUrl];
  }

  try {
    const persisted = localStorage.getItem(`cache_${chunkedUrl}`);
    if (persisted) {
      chunkedUrlsCache[chunkedUrl] = persisted;
      return persisted;
    }
  } catch (e) {
    // Ignore localStorage errors
  }
  
  const assetId = chunkedUrl.replace('chunked://', '');
  const metaSnap = await getDocWithRetry(doc(db, 'landing_page_chunks', assetId));
  
  if (!metaSnap.exists()) {
    throw new Error(`Chunk metadata not found for ${assetId}`);
  }
  
  const { totalChunks } = metaSnap.data();
  if (typeof totalChunks !== 'number' || totalChunks <= 0) {
    throw new Error(`Invalid chunk count for ${assetId}`);
  }
  
  const chunkPromises = [];
  for (let i = 0; i < totalChunks; i++) {
    chunkPromises.push(getDocWithRetry(doc(db, 'landing_page_chunks', `${assetId}_chunk_${i}`)));
  }
  
  const chunkSnaps = await Promise.all(chunkPromises);
  let fullDataUrl = '';
  for (const snap of chunkSnaps) {
    if (snap.exists()) {
      fullDataUrl += snap.data().chunk || '';
    }
  }
  
  chunkedUrlsCache[chunkedUrl] = fullDataUrl;
  try {
    if (fullDataUrl.length < 1500000) {
      localStorage.setItem(`cache_${chunkedUrl}`, fullDataUrl);
    }
  } catch (e) {
    // Ignore localStorage quota errors
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
