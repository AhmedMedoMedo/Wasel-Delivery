import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAjyqCnBR_57Cklb6hkVfk6epnmhNUHdNo',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'ahmed-account-system.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'ahmed-account-system',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'ahmed-account-system.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '386617344783',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:386617344783:web:00917fae8b7c9704a3f47a',
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
