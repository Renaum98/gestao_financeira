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
import { iniciarAppCheck } from "./app-check.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
} from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  onSnapshot,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  writeBatch,
  arrayUnion,
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

// Antes do getAuth/initializeFirestore de propósito: o App Check precisa estar
// de pé antes que qualquer serviço faça a primeira chamada, senão ela sai sem
// token e é recusada quando a aplicação estiver ligada no Console.
iniciarAppCheck(app);

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
//
// O getIdToken(true) não é detalhe: as Security Rules exigem `email_verified`, e
// esse claim mora no ID token, que vale ~1h. O reload() atualiza o objeto em
// memória, mas o token que o Firestore usa nas requisições continua sendo o
// antigo — o que dizia que o e-mail não estava confirmado. Sem forçar a troca,
// quem acabou de confirmar entra no app e leva permission-denied em tudo até o
// token vencer sozinho.
export async function recarregarUsuario() {
  if (!auth.currentUser) return null;
  await auth.currentUser.reload();
  if (auth.currentUser.emailVerified) {
    try {
      await auth.currentUser.getIdToken(true);
    } catch (err) {
      console.warn("[auth] não renovou o token depois da confirmação:", err);
    }
  }
  return auth.currentUser;
}

export function redefinirSenha(email) {
  return sendPasswordResetEmail(auth, email);
}

export function sair() {
  return signOut(auth);
}

// Reautentica o usuário atual com a senha — necessário antes de operações
// sensíveis como deleteUser. Lança erro se a senha estiver incorreta.
export async function reautenticarComSenha(senha) {
  if (!auth.currentUser?.email) throw new Error("Sem sessão ativa.");
  const cred = EmailAuthProvider.credential(auth.currentUser.email, senha);
  await reauthenticateWithCredential(auth.currentUser, cred);
}

// Apaga o usuário do Firebase Auth. Pode lançar `auth/requires-recent-login`
// se o login for antigo — nesse caso o caller precisa pedir reautenticação.
export async function excluirContaAuth() {
  if (!auth.currentUser) throw new Error("Sem sessão ativa.");
  await deleteUser(auth.currentUser);
}

export function escutarAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  onSnapshot,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  writeBatch,
  arrayUnion,
};
