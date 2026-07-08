const fs = require('fs');
let content = fs.readFileSync('src/lib/firebase.ts', 'utf8');
content = content.replace(
  /errMsg\.includes\('exceeded'\)/,
  "errMsg.includes('exceeded') ||\n    errMsg.includes('offline') ||\n    errMsg.includes('unavailable') ||\n    errCode === 'unavailable'"
);
fs.writeFileSync('src/lib/firebase.ts', content);
