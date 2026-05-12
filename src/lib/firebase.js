// firebase.js — inicialização do Firebase + auth Google + Firestore.
//
// ┌─────────────────────────────────────────────────────────────────────┐
// │  COLE AQUI a configuração do seu projeto Firebase.                 │
// │  Console Firebase → Configurações do projeto → "Seus apps" → Web. │
// │  Essas chaves são públicas por design (não são segredos);          │
// │  o acesso aos dados é controlado pelas Security Rules do Firestore.│
// └─────────────────────────────────────────────────────────────────────┘
//
// IMPORTANTE: para o login com Google funcionar você precisa:
//   1. Authentication → Sign-in method → habilitar "Google".
//   2. Authentication → Settings → Authorized domains → adicionar:
//      - localhost (já vem por padrão)
//      - <seu-usuario>.github.io (necessário para GitHub Pages)

import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";

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

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

const googleProvider = new GoogleAuthProvider();

// Detecta PWA standalone (instalado na tela inicial) — nesse caso, popup
// pode ser bloqueado pelo OS, então usamos redirect.
function isStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

export async function entrarComGoogle() {
  if (isStandalone()) {
    return signInWithRedirect(auth, googleProvider);
  }
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (err) {
    // Se o popup for bloqueado (browsers conservadores, iOS Safari), cai para redirect.
    if (
      err?.code === "auth/popup-blocked" ||
      err?.code === "auth/operation-not-supported-in-this-environment"
    ) {
      return signInWithRedirect(auth, googleProvider);
    }
    throw err;
  }
}

export function sair() {
  return signOut(auth);
}

export function escutarAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

// Processa o resultado de signInWithRedirect quando o app recarrega depois da
// volta do Google. Chame uma vez no boot — onAuthStateChanged faz o resto.
export function processarRedirect() {
  return getRedirectResult(auth).catch((err) => {
    console.error("[Firebase] erro processando redirect:", err);
  });
}

export { doc, getDoc, setDoc, onSnapshot };
