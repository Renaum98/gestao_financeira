// account.js — exclusão completa da conta com limpeza de TODOS os dados.
//
// O fluxo abaixo é feito do lado do cliente porque não usamos Cloud Functions.
// O usuário precisa estar autenticado e, normalmente, ter logado recentemente
// (`deleteUser` exige isso — caso contrário, lança `auth/requires-recent-login`
// e o caller chama `reautenticarComSenha` antes de tentar de novo).
//
// Ordem das operações (best-effort onde possível; falhas em etapas auxiliares
// não impedem a exclusão da conta):
//
//   1) Se há parceria ativa → marca a partnership como desfeita (o parceiro
//      vê via snapshot e recebe a notificação igual ao "desfazer" comum).
//   2) Deleta todos os convites em que sou `fromUid` ou `toUid`.
//   3) Deleta o doc `userIndex/{email}`.
//   4) Deleta o doc `users/{uid}`.
//   5) Deleta o usuário do Firebase Auth.
//
// ⚠️  Importante: se um admin remover o usuário direto pelo Console do Firebase,
// nada disso roda. Os dados ficam órfãos no Firestore. A solução robusta pra
// esse caso é uma Cloud Function `onAuthDelete` — fora do escopo atual.

import {
  db,
  auth,
  doc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  collection,
  query,
  where,
  serverTimestamp,
  excluirContaAuth,
} from "./firebase.js";

const USERS = "users";
const USER_INDEX = "userIndex";
const INVITES = "invites";
const PARTNERSHIPS = "partnerships";

async function marcarParceriaComoDesfeita({ uid, meuNome, partnershipId }) {
  if (!partnershipId) return;
  try {
    const pRef = doc(db, PARTNERSHIPS, partnershipId);
    const pDoc = await getDoc(pRef);
    if (!pDoc.exists()) return;
    const dataP = pDoc.data();
    if (dataP.desfeitoPor) return; // já está marcada
    const patch = { desfeitoPor: uid, desfeitoEm: serverTimestamp() };
    if (meuNome) patch.desfeitoNome = meuNome;
    await updateDoc(pRef, patch);
  } catch (err) {
    console.warn("[excluirConta] falha ao desfazer parceria:", err);
  }
}

async function apagarConvites(uid) {
  const apagar = async (campo) => {
    try {
      const q = query(collection(db, INVITES), where(campo, "==", uid));
      const snap = await getDocs(q);
      await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
    } catch (err) {
      console.warn(`[excluirConta] falha ao apagar invites por ${campo}:`, err);
    }
  };
  await Promise.all([apagar("fromUid"), apagar("toUid")]);
}

async function apagarUserIndex(email) {
  if (!email) return;
  try {
    await deleteDoc(doc(db, USER_INDEX, email.toLowerCase()));
  } catch (err) {
    console.warn("[excluirConta] falha ao apagar userIndex:", err);
  }
}

// Apaga os dados do Firestore (passos 1-4 acima). NÃO deleta o usuário do Auth.
// Útil quando precisamos retry com reautenticação no passo 5.
async function apagarDadosDaConta({
  uid,
  meuEmail,
  meuNome,
  partnershipId,
}) {
  if (!uid) throw new Error("Sem usuário.");
  // Passo 1: avisa o parceiro (se houver).
  await marcarParceriaComoDesfeita({ uid, meuNome, partnershipId });
  // Passos 2 e 3 em paralelo (independentes).
  await Promise.all([apagarConvites(uid), apagarUserIndex(meuEmail)]);
  // Passo 4: o doc do usuário em si.
  await deleteDoc(doc(db, USERS, uid));
}

// Fluxo completo: apaga dados + apaga conta no Auth.
// Se lançar `auth/requires-recent-login`, o caller precisa reautenticar e
// chamar de novo (os dados Firestore já vão estar deletados — o segundo
// `apagarDadosDaConta` é idempotente).
export async function excluirContaCompleta({
  uid,
  meuEmail,
  meuNome,
  partnershipId,
}) {
  // Idempotência: se o user doc já não existe, pula direto pro auth.
  const userRef = doc(db, USERS, uid);
  const userSnap = await getDoc(userRef).catch(() => null);
  if (userSnap?.exists()) {
    await apagarDadosDaConta({ uid, meuEmail, meuNome, partnershipId });
  }
  await excluirContaAuth();
}

// Helper: identifica se o erro é o pedido de reautenticação.
export function precisaReautenticar(err) {
  return err?.code === "auth/requires-recent-login";
}
