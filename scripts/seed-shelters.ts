// One-off seed: creates the shelters collection (+ participants/applicants
// subcollections) in Firestore. Idempotent — deterministic doc ids.
// Run: node scripts/seed-shelters.ts
import { initializeApp } from "firebase/app";
import { getFirestore, doc, writeBatch, getDocs, collection } from "firebase/firestore";
import { SEED_SHELTERS } from "../lib/shelters/seed-data.ts";

const app = initializeApp({
  apiKey: "AIzaSyCScpBpv0wEyQLxiKCCW9IFkllCTvNV1ac",
  authDomain: "milpitashacks-e051c.firebaseapp.com",
  projectId: "milpitashacks-e051c",
  storageBucket: "milpitashacks-e051c.firebasestorage.app",
  messagingSenderId: "934376505176",
  appId: "1:934376505176:web:6ac4aa8d15a54177afaf2d",
});
const db = getFirestore(app);

const batch = writeBatch(db);
for (const s of SEED_SHELTERS) {
  const { participants, applicants, ...shelter } = s;
  batch.set(doc(db, "shelters", s.id), shelter);
  for (const p of participants) batch.set(doc(db, "shelters", s.id, "participants", p.id), p);
  for (const a of applicants) batch.set(doc(db, "shelters", s.id, "applicants", a.id), a);
}
await batch.commit();

const snap = await getDocs(collection(db, "shelters"));
console.log(`Seeded ${snap.size} shelters.`);
process.exit(0);
