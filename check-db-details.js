import { initializeApp } from 'firebase/app';
import { initializeFirestore, getDoc, doc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true
}, firebaseConfig.firestoreDatabaseId);

async function run() {
  try {
    const snap = await getDoc(doc(db, 'landing_pages', 'main'));
    if (snap.exists()) {
      const data = snap.data();
      console.log('--- DATABASE DATA ---');
      console.log('fehrmannStats:', JSON.stringify(data.fehrmannStats, null, 2));
      console.log('references:', JSON.stringify(data.references, null, 2));
    } else {
      console.log('No document found in Firestore!');
    }
  } catch (err) {
    console.error('Error reading Firestore:', err);
  }
  process.exit(0);
}

run();
