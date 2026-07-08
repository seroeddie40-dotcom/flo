const fs = require('fs');
let content = fs.readFileSync('src/components/AdminBackend.tsx', 'utf8');

content = content.replace(
  "Hinweis: Firebase-Speicherlimit (Google Quota) erreicht",
  "Hinweis: Offline-Modus aktiv (Keine Serververbindung)"
);

content = content.replace(
  "Wegen des täglichen Google Firebase Free-Tier Leselimits wird aktuell ein schreibgeschützter Fallback geladen.",
  "Aufgrund von Verbindungsproblemen zur Datenbank (Offline) oder Server-Limits wird aktuell ein schreibgeschützter Offline-Modus geladen."
);

content = content.replace(
  "Sobald das Limit von Google zurückgesetzt wird (meistens um Mitternacht), wird dein cloud-gespeicherter Content automatisch wieder geladen!",
  "Sobald die Verbindung wiederhergestellt ist, wird dein cloud-gespeicherter Content automatisch wieder synchronisiert!"
);

fs.writeFileSync('src/components/AdminBackend.tsx', content);
