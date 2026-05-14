// partnership.js — Convite, aceite e ciclo de vida da "conta compartilhada".
//
// Modelo de dados (resumo):
//   invites/{id}    { fromUid, fromNome, fromEmail, toUid, toNome, status, partnershipId?, criadoEm }
//   partnerships/{pId} { members: [uidA, uidB], caixinhas: [], criadoEm }
//   users/{uid}     { ..., partnerUid, partnerNome, partnershipId }
//   userIndex/{emailLower} { uid, nome }
//
// Etapa 2 (este arquivo agora): cria o vínculo entre dois usuários.
//   - As caixinhas ainda ficam em users/{uid}.caixinhas (sem mesclar).
//   - A migração delas pra partnerships/{pId}.caixinhas acontece na Etapa 4.
//
// Detalhe importante das Security Rules: cada usuário só pode escrever no
// próprio doc. Por isso o aceite acontece em duas metades:
//   1) Quem aceita: cria a partnership, marca o próprio user e atualiza o invite.
//   2) Quem enviou: um listener detecta o invite aceito e marca o próprio user.

import { useEffect, useRef, useState } from "react";
import {
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from "./firebase.js";

const INVITES = "invites";
const USERS = "users";
const USER_INDEX = "userIndex";
const PARTNERSHIPS = "partnerships";

// ─── Busca de usuário por e-mail ──────────────────────────────────────────

// Retorna { uid, nome, temParceiro } ou null se não encontrou.
async function buscarUidPorEmail(emailLower) {
  const ref = doc(db, USER_INDEX, emailLower);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    uid: data.uid,
    nome: data.nome || "",
    temParceiro: data.temParceiro === true,
  };
}

// Atualiza meu próprio userIndex com a flag temParceiro. Usado pra bloquear
// convites a alguém já em uma parceria — verificado no convidarPorEmail.
async function definirFlagParceriaNoIndex(uid, email, temParceiro) {
  if (!uid || !email) return;
  const ref = doc(db, USER_INDEX, email.toLowerCase());
  try {
    await setDoc(ref, { uid, temParceiro }, { merge: true });
  } catch (err) {
    console.error("[userIndex temParceiro]", err);
  }
}

// ─── Convite ───────────────────────────────────────────────────────────────

// Erros usam mensagens humanas; a UI mostra direto.
export async function convidarPorEmail({
  meuUid,
  meuNome,
  meuEmail,
  emailParceiro,
}) {
  const emailLower = (emailParceiro || "").trim().toLowerCase();
  if (!emailLower) throw new Error("Digite um e-mail.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower))
    throw new Error("E-mail inválido.");
  if (emailLower === (meuEmail || "").toLowerCase())
    throw new Error("Você não pode convidar a si mesmo.");

  const parceiro = await buscarUidPorEmail(emailLower);
  if (!parceiro) throw new Error("Ninguém com esse e-mail está usando o app.");
  if (parceiro.uid === meuUid)
    throw new Error("Você não pode convidar a si mesmo.");

  // Parceiro já está em outra parceria? (a conta só pode ser entre 2 pessoas)
  if (parceiro.temParceiro) {
    throw new Error(
      "Essa pessoa já está em uma conta compartilhada com outra pessoa.",
    );
  }

  // Eu já estou em uma parceria? (leitura permitida — meu próprio doc)
  const meuDoc = await getDoc(doc(db, USERS, meuUid));
  if (meuDoc.exists() && meuDoc.data().partnerUid) {
    throw new Error(
      "Você já está em uma conta compartilhada. Desfaça primeiro.",
    );
  }

  // Já existe convite pendente entre nós?
  const q = query(
    collection(db, INVITES),
    where("fromUid", "==", meuUid),
    where("toUid", "==", parceiro.uid),
    where("status", "==", "pendente"),
  );
  const existentes = await getDocs(q);
  if (!existentes.empty) {
    throw new Error("Você já enviou um convite. Aguarde a resposta.");
  }

  await addDoc(collection(db, INVITES), {
    fromUid: meuUid,
    fromNome: meuNome || "",
    fromEmail: (meuEmail || "").toLowerCase() || null,
    toUid: parceiro.uid,
    toNome: parceiro.nome,
    status: "pendente",
    criadoEm: serverTimestamp(),
  });
}

// ─── Aceitar / Recusar ─────────────────────────────────────────────────────

// Tag cada caixinha + depósitos com o uid do dono atual. Não altera caixinhas
// que já tenham tag.
function tagearCaixinhas(caixinhas, uid) {
  return (caixinhas || []).map((cx) => ({
    ...cx,
    criadoPor: cx.criadoPor || uid,
    depositos: (cx.depositos || []).map((d) => ({
      ...d,
      feitoPor: d.feitoPor || uid,
    })),
  }));
}

// Quem aceita faz tudo o que pode fazer sozinho. O lado de quem enviou é
// completado automaticamente por `useFinalizarPareamento` no App.
//
// Etapa 4: minhas caixinhas migram pra partnership no momento do aceite e são
// limpas do meu user doc.
export async function aceitarConvite({ invite, meuUid, meuNome, meuEmail }) {
  // Re-checa que eu ainda não estou em outra parceria.
  const meuDoc = await getDoc(doc(db, USERS, meuUid));
  if (meuDoc.exists() && meuDoc.data().partnerUid) {
    throw new Error(
      "Você já está em uma conta compartilhada. Desfaça primeiro.",
    );
  }

  const minhasCaixinhas = tagearCaixinhas(
    meuDoc.exists() ? meuDoc.data().caixinhas || [] : [],
    meuUid,
  );

  const pId = `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const partnershipRef = doc(db, PARTNERSHIPS, pId);
  const userRef = doc(db, USERS, meuUid);
  const inviteRef = doc(db, INVITES, invite.id);

  const batch = writeBatch(db);
  batch.set(partnershipRef, {
    members: [invite.fromUid, meuUid],
    caixinhas: minhasCaixinhas,
    criadoEm: serverTimestamp(),
  });
  batch.update(userRef, {
    partnerUid: invite.fromUid,
    partnerNome: invite.fromNome || "",
    partnershipId: pId,
    caixinhas: [], // migradas pra partnership
  });
  batch.update(inviteRef, {
    status: "aceito",
    partnershipId: pId,
    toNome: meuNome || invite.toNome || "",
  });
  await batch.commit();
  // Marca no userIndex que agora estou em uma parceria.
  // Falha silenciosa: o pareamento já foi feito; índice é otimização.
  if (meuEmail) {
    await definirFlagParceriaNoIndex(meuUid, meuEmail, true);
  }
}

export async function recusarConvite(inviteId) {
  await updateDoc(doc(db, INVITES, inviteId), { status: "recusado" });
}

// Quem enviou pode cancelar antes de ter resposta.
export async function cancelarConvite(inviteId) {
  await deleteDoc(doc(db, INVITES, inviteId));
}

// ─── Finalização do lado de quem enviou ────────────────────────────────────

// Chamado automaticamente quando um convite que EU enviei vira 'aceito'.
// Marca o meu user com o parceiro, migra minhas caixinhas pra partnership
// (somando às que o outro lado já tinha colocado) e deleta o invite.
export async function finalizarPareamento({ invite, meuUid }) {
  const partnershipRef = doc(db, PARTNERSHIPS, invite.partnershipId);
  const pDoc = await getDoc(partnershipRef);

  // Edge case: parceiro aceitou e logo após desfez a parceria — quando eu
  // abrir o app, a partnership não existe mais. Apenas limpo o invite e
  // não faço o pareamento (afinal não há mais com quem parear).
  if (!pDoc.exists()) {
    await deleteDoc(doc(db, INVITES, invite.id));
    return;
  }

  const meuDoc = await getDoc(doc(db, USERS, meuUid));
  const minhasCaixinhas = tagearCaixinhas(
    meuDoc.exists() ? meuDoc.data().caixinhas || [] : [],
    meuUid,
  );

  // Merge por id — caixinhas com mesmo id não duplicam.
  const cxExistentes = pDoc.data().caixinhas || [];
  const idsExistentes = new Set(cxExistentes.map((c) => c.id));
  const novas = minhasCaixinhas.filter((c) => !idsExistentes.has(c.id));
  const merged = [...cxExistentes, ...novas];

  const batch = writeBatch(db);
  if (novas.length > 0) {
    batch.update(partnershipRef, { caixinhas: merged });
  }
  batch.update(doc(db, USERS, meuUid), {
    partnerUid: invite.toUid,
    partnerNome: invite.toNome || "",
    partnershipId: invite.partnershipId,
    caixinhas: [], // migradas pra partnership
  });
  batch.delete(doc(db, INVITES, invite.id));
  await batch.commit();
  // Atualiza userIndex pra refletir que agora tenho parceria.
  const meuEmail = meuDoc.data()?.email;
  if (meuEmail) {
    await definirFlagParceriaNoIndex(meuUid, meuEmail, true);
  }
}

// ─── Desfazer parceria ────────────────────────────────────────────────────

// Quem clica em "Desfazer" leva todas as caixinhas (combinado na Etapa 1).
// O parceiro tem seus campos de parceria limpos por `useLimparParceriaOrfa`
// quando ele detecta que a partnership sumiu.
export async function desfazerParceria({ uid, partnershipId, meuEmail }) {
  if (!partnershipId) throw new Error("Sem parceria ativa.");
  const pRef = doc(db, PARTNERSHIPS, partnershipId);
  const pDoc = await getDoc(pRef);
  const caixinhasFinais = pDoc.exists() ? pDoc.data().caixinhas || [] : [];

  const batch = writeBatch(db);
  batch.update(doc(db, USERS, uid), {
    caixinhas: caixinhasFinais,
    partnerUid: null,
    partnerNome: null,
    partnershipId: null,
  });
  batch.delete(pRef);
  await batch.commit();
  // Libera o índice pra novos convites.
  if (meuEmail) {
    await definirFlagParceriaNoIndex(uid, meuEmail, false);
  }
}

// ─── Hooks ─────────────────────────────────────────────────────────────────

// Convites pendentes endereçados a mim (eu sou toUid). UI mostra na tela de
// notificações como "X convidou você".
export function useConvitesRecebidos(uid) {
  const [convites, setConvites] = useState([]);
  useEffect(() => {
    if (!uid) {
      setConvites([]);
      return;
    }
    const q = query(
      collection(db, INVITES),
      where("toUid", "==", uid),
      where("status", "==", "pendente"),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setConvites(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => console.error("[invites recebidos]", err),
    );
    return unsub;
  }, [uid]);
  return convites;
}

// Convites que EU enviei. Uso interno: o App escuta esse hook e, sempre que um
// convite vira 'aceito', chama `finalizarPareamento` automaticamente.
export function useConvitesEnviados(uid) {
  const [convites, setConvites] = useState([]);
  useEffect(() => {
    if (!uid) {
      setConvites([]);
      return;
    }
    const q = query(collection(db, INVITES), where("fromUid", "==", uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setConvites(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => console.error("[invites enviados]", err),
    );
    return unsub;
  }, [uid]);
  return convites;
}

// Lê o doc do parceiro (read-only). Funciona porque, com a parceria firmada,
// as Security Rules permitem leitura cruzada: `souParceiroDe(uid)` libera
// se o doc do parceiro aponta `partnerUid` de volta pra mim.
export function usePartnerData(partnerUid) {
  const VAZIO = {
    txs: [],
    recorrentes: [],
    categoriasCustom: [],
    orcamentos: {},
    orcamentoMensal: 0,
    nome: "",
    email: null,
    ready: false,
  };
  const [data, setData] = useState(VAZIO);
  useEffect(() => {
    if (!partnerUid) {
      setData(VAZIO);
      return;
    }
    const ref = doc(db, USERS, partnerUid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) return;
        const d = snap.data();
        setData({
          txs: d.txs ?? [],
          recorrentes: d.recorrentes ?? [],
          categoriasCustom: d.categoriasCustom ?? [],
          orcamentos: d.orcamentos ?? {},
          orcamentoMensal: d.preferences?.orcamentoMensal || 0,
          nome: d.preferences?.nome || "",
          email: d.email || null,
          ready: true,
        });
      },
      (err) => console.error("[partnerData]", err),
    );
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerUid]);
  return data;
}

// Caixinhas compartilhadas: vivem em partnerships/{pId}.caixinhas. Os setters
// fazem updateDoc com a lista inteira (mesmo padrão do useCloudState pessoal).
// Em casos concorrentes raros (ambos editando ao mesmo tempo), o último write
// ganha — aceitável pra uso de casal. Se virar problema, dá pra envolver em
// runTransaction depois.
export function useSharedCaixinhas({ partnershipId, uid }) {
  const [caixinhas, setCaixinhas] = useState([]);
  const [ready, setReady] = useState(false);
  const [existe, setExiste] = useState(true); // false = partnership foi deletada
  const caixinhasRef = useRef([]);

  useEffect(() => {
    caixinhasRef.current = caixinhas;
  }, [caixinhas]);

  useEffect(() => {
    if (!partnershipId) {
      setCaixinhas([]);
      setReady(false);
      setExiste(true);
      return;
    }
    const ref = doc(db, PARTNERSHIPS, partnershipId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setCaixinhas(snap.data().caixinhas || []);
          setExiste(true);
        } else {
          setCaixinhas([]);
          setExiste(false); // parceiro desfez a parceria
        }
        setReady(true);
      },
      (err) => console.error("[shared caixinhas]", err),
    );
    return unsub;
  }, [partnershipId]);

  const ref = partnershipId ? doc(db, PARTNERSHIPS, partnershipId) : null;

  const salvarCaixinha = async (dados) => {
    if (!ref) return;
    const lista = caixinhasRef.current;
    let novaLista;
    if (dados.id) {
      novaLista = lista.map((c) =>
        c.id === dados.id ? { ...c, ...dados } : c,
      );
    } else {
      const nova = {
        id: `cx-${Date.now()}`,
        criadoEm: new Date().toISOString().slice(0, 10),
        criadoPor: uid,
        depositos: [],
        ...dados,
      };
      novaLista = [nova, ...lista];
    }
    await updateDoc(ref, { caixinhas: novaLista });
  };

  const excluirCaixinha = async (id) => {
    if (!ref) return;
    const novaLista = caixinhasRef.current.filter((c) => c.id !== id);
    await updateDoc(ref, { caixinhas: novaLista });
  };

  const depositarCaixinha = async (id, deposito) => {
    if (!ref) return;
    const novaLista = caixinhasRef.current.map((c) =>
      c.id === id
        ? {
            ...c,
            depositos: [
              ...(c.depositos || []),
              { ...deposito, feitoPor: uid },
            ],
          }
        : c,
    );
    await updateDoc(ref, { caixinhas: novaLista });
  };

  return {
    caixinhas,
    ready,
    existe,
    salvarCaixinha,
    excluirCaixinha,
    depositarCaixinha,
  };
}

// Se eu tenho `partnershipId` setado mas a partnership não existe mais (parceiro
// desfez), limpa meus próprios campos de parceria.
export function useLimparParceriaOrfa({
  uid,
  meuEmail,
  partnershipId,
  partnershipExiste,
}) {
  useEffect(() => {
    if (!uid || !partnershipId) return;
    if (partnershipExiste !== false) return; // só age quando confirmado que sumiu
    (async () => {
      try {
        await updateDoc(doc(db, USERS, uid), {
          partnerUid: null,
          partnerNome: null,
          partnershipId: null,
        });
        if (meuEmail) {
          await definirFlagParceriaNoIndex(uid, meuEmail, false);
        }
      } catch (err) {
        console.error("[limpar parceria órfã]", err);
      }
    })();
  }, [uid, meuEmail, partnershipId, partnershipExiste]);
}

// Hook auxiliar pro App: detecta quando um convite enviado por mim ficou
// 'aceito' e completa o pareamento do meu lado.
export function useFinalizarPareamento({ uid, jaTenhoParceiro, enviados }) {
  useEffect(() => {
    if (!uid || jaTenhoParceiro) return;
    const aceito = enviados.find((i) => i.status === "aceito");
    if (!aceito) return;
    finalizarPareamento({ invite: aceito, meuUid: uid }).catch((err) =>
      console.error("[finalizarPareamento]", err),
    );
  }, [uid, jaTenhoParceiro, enviados]);
}
