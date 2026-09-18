// push.js — assinatura de Web Push deste aparelho e o vínculo dela com a conta.
//
// O disparo local (notifications.js) só acontece com o app aberto. Pra avisar
// com o app fechado, o navegador dá ao app uma ASSINATURA de push — um endpoint
// no serviço do próprio navegador (FCM, APNs…) mais chaves de cifra — e quem
// manda a notificação é o nosso servidor (api/push/enviar.js, cron diário na
// Vercel). Este módulo cuida do lado de cá:
//
//   1. assina (ou reaproveita a assinatura existente) quando a permissão de
//      notificação está concedida;
//   2. guarda a assinatura em `pushSubs/{id}` no Firestore, com o uid, pra que
//      o servidor saiba a quem ela pertence;
//   3. mantém o registro "já avisei" dos dois lados igual: o que o app mostrou
//      localmente vai pra assinatura (o servidor não repete), e o que o
//      servidor mandou vem pro localStorage (o app não repete ao abrir).
//
// O que o servidor precisa pra isto funcionar (conta de serviço, chave VAPID
// privada, cron) está em docs/push-setup.md. Enquanto não estiver configurado
// o app segue como antes: lembretes locais ao abrir. Nada aqui é obrigatório.

import {
  auth,
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from './firebase.js';
import { lerEnviadas, mesclarEnviadas } from './notif-enviadas.js';

// A chave PÚBLICA VAPID — o que o navegador recebe ao assinar o push, pra o
// serviço de push (Apple, Google, Mozilla) saber que quem envia é o nosso
// servidor. É pública mesmo; a privada mora só na Vercel (VAPID_PRIVATE_KEY,
// com uma cópia no .env local fora do git). Mesmo esquema da cineteca.
// ⚠️ Trocar esta invalida TODAS as assinaturas já feitas nos aparelhos.
export const VAPID_PUBLIC_KEY =
  'BHH2JUM77uUq667wnxMsOhFfQxGdTrU-SJUODNAJJm6AluY9HqBl8YInBuEa9qN-FUBKAGueO8GHyac5uG8fF5o';

const COLECAO = 'pushSubs';

export function pushSuportado() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

// A chave VAPID vem em base64url; o `subscribe` quer os bytes.
function base64UrlParaBytes(b64url) {
  const padding = '='.repeat((4 - (b64url.length % 4)) % 4);
  const b64 = (b64url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// Id do doc no Firestore: hash do endpoint. O endpoint é uma URL (tem barras,
// é longo) e não serve de id; o hash é estável — o mesmo aparelho cai sempre
// no mesmo doc, então re-sincronizar é idempotente.
async function idDaAssinatura(endpoint) {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Sem WebCrypto (contexto inseguro): djb2 sobre a string. Fraco, mas o
    // único uso é distinguir os poucos aparelhos de uma mesma conta.
    let h = 5381;
    for (let i = 0; i < endpoint.length; i++) h = ((h << 5) + h + endpoint.charCodeAt(i)) | 0;
    return `h${(h >>> 0).toString(16)}-${endpoint.length}`;
  }
}

// `getRegistration`, e não `ready`: em dev o VitePWA não registra o service
// worker, e `ready` ficaria pendurado pra sempre esperando um que não vem.
async function registroSW() {
  try {
    return (await navigator.serviceWorker.getRegistration()) || null;
  } catch {
    return null;
  }
}

// Lê o doc da assinatura. Devolve o snapshot (que pode não existir) ou
// 'alheio' quando as regras barraram a leitura — o único motivo pra isso é o
// doc pertencer a outro uid (ver firestore.rules).
async function lerDocDaAssinatura(ref) {
  try {
    return await getDoc(ref);
  } catch (err) {
    if (err?.code === 'permission-denied') return 'alheio';
    throw err;
  }
}

// A assinatura existente foi feita com OUTRA chave pública? Acontece quando o
// par VAPID é trocado (docs/push-setup.md): o serviço de push passaria a
// recusar os envios com 403 e a assinatura velha nunca morreria sozinha.
function chaveDiferente(sub) {
  const atual = sub.options?.applicationServerKey;
  if (!atual) return false;
  const a = new Uint8Array(atual);
  const b = base64UrlParaBytes(VAPID_PUBLIC_KEY);
  if (a.length !== b.length) return true;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return true;
  return false;
}

async function assinar(reg) {
  return reg.pushManager.subscribe({
    // Exigência do Chrome: todo push tem que virar uma notificação visível.
    userVisibleOnly: true,
    applicationServerKey: base64UrlParaBytes(VAPID_PUBLIC_KEY),
  });
}

// Memo da sincronização por sessão: o disparo local chama isto a cada
// abertura de tela, e uma leitura do Firestore por sessão basta. Resolve com
// o id do doc da assinatura deste aparelho.
let sincronizacao = null;

async function sincronizar() {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;
  const reg = await registroSW();
  if (!reg?.pushManager) return null;

  let sub = await reg.pushManager.getSubscription();
  if (sub && chaveDiferente(sub)) {
    try {
      await sub.unsubscribe();
    } catch {}
    sub = null;
  }
  if (!sub) sub = await assinar(reg);

  let id = await idDaAssinatura(sub.endpoint);
  let ref = doc(db, COLECAO, id);
  let snap = await lerDocDaAssinatura(ref);

  // A assinatura é do navegador, não da conta: se outra pessoa logou neste
  // mesmo aparelho, o doc existente pertence a ela (e as regras não deixam
  // nem ler, nem sobrescrever). Refaz a assinatura pra ganhar um endpoint
  // novo, só nosso; o doc antigo morre quando o servidor tentar mandar e o
  // endpoint responder 410.
  if (snap === 'alheio') {
    try {
      await sub.unsubscribe();
    } catch {}
    sub = await assinar(reg);
    id = await idDaAssinatura(sub.endpoint);
    ref = doc(db, COLECAO, id);
    snap = await lerDocDaAssinatura(ref);
    if (snap === 'alheio') return null;
  }

  if (!snap.exists()) {
    const json = sub.toJSON();
    await setDoc(ref, {
      uid,
      endpoint: json.endpoint,
      keys: json.keys,
      // Semente: o que este aparelho já mostrou localmente não precisa
      // chegar de novo por push amanhã de manhã.
      enviadas: [...lerEnviadas()],
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });
  } else {
    // Sentido inverso: o que o servidor já mandou pra cá não dispara de novo
    // quando o app abrir.
    mesclarEnviadas(snap.data().enviadas || []);
  }

  return id;
}

// Garante assinatura + doc no Firestore e alinha o registro "já avisei".
// Resolve com o id do doc, ou null quando não há push (sem suporte, sem
// permissão, sem login, offline…). Nunca rejeita: push é extra, não pode
// derrubar o disparo local que vem logo depois.
export function sincronizarPush() {
  if (!pushSuportado()) return Promise.resolve(null);
  if (Notification.permission !== 'granted') return Promise.resolve(null);
  if (!sincronizacao) {
    sincronizacao = sincronizar().catch((err) => {
      console.warn('[push] não sincronizou a assinatura:', err);
      // Solta o memo pra tentar de novo na próxima chamada (pode ter sido
      // só falta de rede).
      sincronizacao = null;
      return null;
    });
  }
  return sincronizacao;
}

// O disparo local acabou de mostrar estes ids: registra na assinatura pra o
// servidor não repetir. `arrayUnion` e não um set do array inteiro — o
// servidor também escreve nesse campo, e união nunca perde o que ele pôs.
export async function registrarEnviadasNoPush(ids) {
  if (!ids || ids.length === 0) return;
  const id = await sincronizarPush();
  if (!id) return;
  try {
    await updateDoc(doc(db, COLECAO, id), {
      enviadas: arrayUnion(...ids),
      atualizadoEm: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[push] não registrou as enviadas:', err);
  }
}
