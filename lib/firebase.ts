// Firebase client init. The web config is public by design (it identifies the
// project; security is enforced by Firestore rules, not by hiding these keys).
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCScpBpv0wEyQLxiKCCW9IFkllCTvNV1ac",
  authDomain: "milpitashacks-e051c.firebaseapp.com",
  projectId: "milpitashacks-e051c",
  storageBucket: "milpitashacks-e051c.firebasestorage.app",
  messagingSenderId: "934376505176",
  appId: "1:934376505176:web:6ac4aa8d15a54177afaf2d",
  measurementId: "G-42R41Y2QPN",
};

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db: Firestore = getFirestore(app);
