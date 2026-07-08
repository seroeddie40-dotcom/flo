const fs = require('fs');
let content = fs.readFileSync('src/lib/firebase.ts', 'utf8');

content = content.replace(
  /export function isQuotaError\(err: unknown\): boolean \{[\s\S]*?\}/,
  `export function isQuotaError(err: unknown): boolean {
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
}`
);

content = content.replace(
  /export function logSafeFirebaseError\(contextMessage: string, err: any\) \{[\s\S]*?\}\n/g,
  `export function logSafeFirebaseError(contextMessage: string, err: any) {
  if (isQuotaError(err)) {
    console.warn(\`\${contextMessage}: Firebase is currently in read-only local fallback mode due to server limits.\`);
  } else if (isOfflineError(err)) {
    console.warn(\`\${contextMessage}: Firebase connection unavailable (offline/timeout).\`);
  } else {
    console.error(contextMessage, err);
  }
}
`
);

content = content.replace(
  /export function handleFirestoreError\(error: unknown, operationType: OperationType, path: string \| null\) \{[\s\S]*?const errInfo/g,
  `export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  if (isQuotaError(error)) {
    console.warn('Firebase Error (Quota): Firebase database is currently in read-only local fallback mode due to server limits.');
    throw error;
  }
  if (isOfflineError(error)) {
    console.warn('Firebase Error (Offline): Unable to reach the database.');
    throw error;
  }
  const errInfo`
);

fs.writeFileSync('src/lib/firebase.ts', content);
