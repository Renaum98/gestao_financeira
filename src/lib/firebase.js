// firebase.js — inicialização do Firebase + auth anônima + Firestore
//
// ┌─────────────────────────────────────────────────────────────────────┐
// │  COLE AQUI a configuração do seu projeto Firebase.                 │
// │  Console Firebase → Configurações do projeto → "Seus apps" → Web. │
// │  Essas chaves são públicas por design (não são segredos);          │
// │  o acesso aos dados é controlado pelas Security Rules do Firestore.│
// └─────────────────────────────────────────────────────────────────────┘

import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";

// Suporta tanto chaves hardcoded quanto via .env (VITE_FIREBASE_*).
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Firestore com cache local (funciona offline e em múltiplas abas).
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

// Inicia auth anônima na primeira carga. Retorna uma promise que resolve com o UID.
export function ensureAuth() {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsub();
        resolve(user.uid);
      } else {
        signInAnonymously(auth).catch(reject);
      }
    });
  });
}

export { doc, getDoc, setDoc, onSnapshot };
