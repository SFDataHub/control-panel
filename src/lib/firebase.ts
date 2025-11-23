import { initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

type FirebaseConfig = {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  appId?: string;
};

function readConfig(): FirebaseConfig {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
}

function validateConfig(config: FirebaseConfig) {
  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `[Firebase] Missing config values: ${missing.join(
        ", ",
      )}. Set VITE_FIREBASE_* env vars before running the app.`,
    );
  }
}

let firebaseApp: FirebaseApp | null = null;

function ensureApp(): FirebaseApp {
  if (firebaseApp) return firebaseApp;

  const config = readConfig();
  validateConfig(config);
  firebaseApp = initializeApp(config as Required<FirebaseConfig>);
  return firebaseApp;
}

export const app = ensureApp();
export const db: Firestore = getFirestore(app);

// Helper so tests or future setup steps can provide their own app if needed.
export function createFirestore(customApp: FirebaseApp): Firestore {
  return getFirestore(customApp);
}
