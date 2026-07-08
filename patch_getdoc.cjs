const fs = require('fs');
let content = fs.readFileSync('src/lib/cmsStore.ts', 'utf8');

content = content.replace(
  "const docSnap = await getDoc(configDocRef);",
  "const docSnap = await withTimeout(getDoc(configDocRef), 5000, 'offline');"
);

fs.writeFileSync('src/lib/cmsStore.ts', content);
