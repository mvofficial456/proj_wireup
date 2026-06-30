import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";

// Configuration loaded from firebase-applet-config.json (statically or at runtime)
const firebaseConfig = {
  apiKey: "AIzaSyAdI51CLzmqukZy2MBAfKvbT1xnuNEnkzY",
  authDomain: "gen-lang-client-0104090574.firebaseapp.com",
  projectId: "gen-lang-client-0104090574",
  storageBucket: "gen-lang-client-0104090574.firebasestorage.app",
  messagingSenderId: "904828715457",
  appId: "1:904828715457:web:23e3ca5d76386567fbef40"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, "ai-studio-wireup-12dd7fd6-6b04-4046-987c-f2c310bff6c5");

// testConnection removed to prevent permission denied console errors

export { app, auth, db };
