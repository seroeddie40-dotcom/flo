const fs = require('fs');
let content = fs.readFileSync('src/lib/cmsStore.ts', 'utf8');

const timeoutFunc = `
const withTimeout = <T>(promise: Promise<T>, ms: number, errorMessage: string = 'Timeout'): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errorMessage)), ms))
  ]);
};
`;

content = content.replace(
  "export async function saveLandingPageData(data: LandingPageData): Promise<void> {",
  timeoutFunc + "\nexport async function saveLandingPageData(data: LandingPageData): Promise<void> {"
);

content = content.replace(
  /await setDoc\(doc\(db, 'landing_page_chunks', 'onepager'\), \{/g,
  "await withTimeout(setDoc(doc(db, 'landing_page_chunks', 'onepager'), {"
);
content = content.replace(
  /        updatedAt: new Date\(\)\.toISOString\(\)\n      \}\);/g,
  "        updatedAt: new Date().toISOString()\n      }), 5000, 'offline');"
);

content = content.replace(
  /const chunkWrites = chunks\.map\(\(chunk, index\) => \n        setDoc\(doc\(db, 'landing_page_chunks', `onepager_chunk_\$\{index\}`\), \{ chunk \}\)\n      \);/g,
  "const chunkWrites = chunks.map((chunk, index) => \n        withTimeout(setDoc(doc(db, 'landing_page_chunks', `onepager_chunk_${index}`), { chunk }), 5000, 'offline')\n      );"
);

content = content.replace(
  /await setDoc\(configDocRef, dataCopy\);/g,
  "await withTimeout(setDoc(configDocRef, dataCopy), 5000, 'offline');"
);

fs.writeFileSync('src/lib/cmsStore.ts', content);
