const fs = require('fs');
let content = fs.readFileSync('src/lib/cmsStore.ts', 'utf8');

content = content.replace(
  "const metaSnap = await getDoc(doc(db, 'landing_page_chunks', 'onepager'));",
  "const metaSnap = await withTimeout(getDoc(doc(db, 'landing_page_chunks', 'onepager')), 5000, 'offline');"
);

content = content.replace(
  "chunkPromises.push(getDoc(doc(db, 'landing_page_chunks', `onepager_chunk_${i}`)));",
  "chunkPromises.push(withTimeout(getDoc(doc(db, 'landing_page_chunks', `onepager_chunk_${i}`)), 5000, 'offline'));"
);

fs.writeFileSync('src/lib/cmsStore.ts', content);
