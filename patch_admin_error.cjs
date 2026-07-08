const fs = require('fs');
let content = fs.readFileSync('src/components/AdminBackend.tsx', 'utf8');

content = content.replace(
  "isQuotaError } from '../lib/firebase';",
  "isQuotaError, isOfflineError } from '../lib/firebase';"
);

content = content.replace(
  /if \(isQuotaError\(err\)\) \{/g,
  "if (isQuotaError(err) || isOfflineError(err)) {"
);

fs.writeFileSync('src/components/AdminBackend.tsx', content);

let cmsContent = fs.readFileSync('src/lib/cmsStore.ts', 'utf8');
cmsContent = cmsContent.replace(
  "isQuotaError } from './firebase';",
  "isQuotaError, isOfflineError } from './firebase';"
);

cmsContent = cmsContent.replace(
  /if \(onError && !isQuotaError\(err\)\) onError\(err\);/g,
  "if (onError && !isQuotaError(err) && !isOfflineError(err)) onError(err);"
);

fs.writeFileSync('src/lib/cmsStore.ts', cmsContent);
