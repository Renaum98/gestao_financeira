// firebase.js — inicialização do Firebase + autenticação por e-mail/senha + Firestore.
//
// ┌─────────────────────────────────────────────────────────────────────┐
// │  Configuração do projeto Firebase via variáveis de ambiente (.env). │
// │  Essas chaves são públicas por design (não são segredos);          │
// │  o acesso aos dados é controlado pelas Security Rules do Firestore.│
// └─────────────────────────────────────────────────────────────────────┘
//
// IMPORTANTE no Console do Firebase:
//   1. Authentication → Sign-in method → habilitar "E-mail/senha".
//   2. Authentication → Settings → Authorized domains → adicionar:
//      - localhost (já vem por padrão)
//      - <seu-usuario>.github.io (para o GitHub Pages)
//   3. (Opcional) Authentication → Templates → personalizar o e-mail de verificação.

import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
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

// ─── Autenticação por e-mail/senha ───

// Cria a conta, define o nome, envia o e-mail de verificação e deixa o usuário
// "logado mas não verificado" — o app só libera o acesso depois que ele confirma.
export async function criarConta(nome, email, senha) {
  const cred = await createUserWithEmailAndPassword(auth, email, senha);
  if (nome) {
    try {
      await updateProfile(cred.user, { displayName: nome });
    } catch {
      /* ignora — não é crítico */
    }
  }
  await sendEmailVerification(cred.user);
  return cred.user;
}

export async function entrar(email, senha) {
  const cred = await signInWithEmailAndPassword(auth, email, senha);
  return cred.user;
}

export function reenviarVerificacao() {
  if (!auth.currentUser) return Promise.reject(new Error("sem usuário"));
  return sendEmailVerification(auth.currentUser);
}

// Recarrega o usuário do servidor (para detectar que o e-mail acabou de ser confirmado).
export async function recarregarUsuario() {
  if (!auth.currentUser) return null;
  await auth.currentUser.reload();
  return auth.currentUser;
}

export function redefinirSenha(email) {
  return sendPasswordResetEmail(auth, email);
}

export function sair() {
  return signOut(auth);
}

export function escutarAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export { doc, getDoc, setDoc, onSnapshot };
