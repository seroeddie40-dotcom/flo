const fs = require('fs');
let content = fs.readFileSync('src/components/AdminBackend.tsx', 'utf8');

const timeoutFunc = `
const withTimeout = <T>(promise: Promise<T>, ms: number, errorMessage: string = 'Timeout'): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errorMessage)), ms))
  ]);
};
`;

content = content.replace(
  "export default function AdminBackend() {",
  timeoutFunc + "\nexport default function AdminBackend() {"
);

content = content.replace(
  "const docSnap = await getDoc(docRef);",
  "const docSnap = await withTimeout(getDoc(docRef), 3000, 'offline');"
);

content = content.replace(
  "await setDoc(docRef, defaultCreds);",
  "await withTimeout(setDoc(docRef, defaultCreds), 3000, 'offline');"
);

content = content.replace(
  "await setDoc(docRef, payload);",
  "await withTimeout(setDoc(docRef, payload), 3000, 'offline');"
);

fs.writeFileSync('src/components/AdminBackend.tsx', content);
