const fs = require('fs');
let content = fs.readFileSync('src/lib/firebase.ts', 'utf8');
content = content.replace("}\n}\n\nexport function handleFirestoreError", "}\n\nexport function handleFirestoreError");
fs.writeFileSync('src/lib/firebase.ts', content);
