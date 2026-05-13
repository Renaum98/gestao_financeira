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
  signInWithCredential,
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

// ─── Login com Google ───
//
// Em PWA instalado (iOS/Android), signInWithPopup abre o navegador do sistema
// num contexto separado e o app nunca recebe o resultado; signInWithRedirect
// também falha quando o app não está hospedado no mesmo domínio do authDomain
// (caso do GitHub Pages: app em *.github.io, authDomain em *.firebaseapp.com —
// o Safari particiona o storage e perde a sessão).
//
// Solução: usar o Google Identity Services (GIS) para obter o ID token dentro
// da própria janela do PWA e trocá-lo por uma credencial do Firebase.
// O <script> do GIS é carregado no index.html.

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function gisDisponivel() {
  return typeof window !== "undefined" && !!window.google?.accounts?.id && !!GOOGLE_CLIENT_ID;
}

// Espera o script do GIS carregar (no-op se já estiver pronto).
function aguardarGIS(timeoutMs = 6000) {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const inicio = Date.now();
    const t = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(t);
        resolve();
      } else if (Date.now() - inicio > timeoutMs) {
        clearInterval(t);
        reject(new Error("GIS não carregou"));
      }
    }, 100);
  });
}

// Troca o ID token do Google por uma sessão Firebase.
async function entrarComIdToken(idToken) {
  const cred = GoogleAuthProvider.credential(idToken);
  return signInWithCredential(auth, cred);
}

let gisInicializado = false;
function inicializarGIS(onCredential) {
  if (gisInicializado) {
    window.google.accounts.id.cancel(); // limpa callback anterior
  }
  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (resp) => {
      if (resp?.credential) entrarComIdToken(resp.credential).catch((e) => console.error("[Firebase] signInWithCredential:", e));
    },
    use_fedcm_for_prompt: true,
    auto_select: false,
  });
  gisInicializado = true;
}

// Renderiza o botão oficial "Entrar com Google" do GIS dentro de `elemento`.
// É o caminho mais confiável em PWA. Retorna true se conseguiu renderizar.
export async function renderizarBotaoGoogle(elemento, { onErro } = {}) {
  if (!GOOGLE_CLIENT_ID) {
    onErro?.("VITE_GOOGLE_CLIENT_ID não configurado");
    return false;
  }
  try {
    await aguardarGIS();
  } catch {
    onErro?.("Não foi possível carregar o login do Google");
    return false;
  }
  inicializarGIS();
  elemento.innerHTML = "";
  window.google.accounts.id.renderButton(elemento, {
    type: "standard",
    theme: "outline",
    size: "large",
    text: "continue_with",
    shape: "pill",
    logo_alignment: "left",
    width: Math.min(elemento.clientWidth || 320, 400),
  });
  // Mostra também o One Tap quando disponível (não atrapalha o botão).
  window.google.accounts.id.prompt();
  return true;
}

// Fallback (navegador normal, GIS indisponível): popup → redirect.
export async function entrarComGoogle() {
  if (gisDisponivel()) {
    inicializarGIS();
    window.google.accounts.id.prompt();
    return;
  }
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (err) {
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
