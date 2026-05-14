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
  deleteField,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  arrayUnion,
} from "./firebase.js";
import { compactarCaixinha, compactarCaixinhas } from "./compact.js";

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
// Quando false, removemos o campo (ausência = false).
async function definirFlagParceriaNoIndex(uid, email, temParceiro) {
  if (!uid || !email) return;
  const ref = doc(db, USER_INDEX, email.toLowerCase());
  try {
    if (temParceiro) {
      await setDoc(ref, { uid, temParceiro: true }, { merge: true });
    } else {
      try {
        await updateDoc(ref, { temParceiro: deleteField() });
      } catch {
        // Doc pode não existir ainda — cria sem a flag.
        await setDoc(ref, { uid }, { merge: true });
      }
    }
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

// ─── Notificações de parceria ─────────────────────────────────────────────

// Anexa uma notificação ao MEU próprio user doc. `notif.id` deve ser
// determinístico (ex: `np-<tipo>-<entityId>`) — assim `arrayUnion` dedup
// previne duplicatas se a mesma operação for detectada mais de uma vez.
async function adicionarNotifParceria(uid, notif) {
  if (!uid || !notif?.id) return;
  try {
    await updateDoc(doc(db, USERS, uid), {
      notificacoesParceria: arrayUnion(notif),
    });
  } catch (err) {
    console.warn("[notif parceria]", err);
  }
}

// ─── Aceitar / Recusar ─────────────────────────────────────────────────────

// Tag cada caixinha + depósitos com o uid do dono atual e compacta o
// resultado pra remover defaults antes de salvar na partnership.
function tagearCaixinhas(caixinhas, uid) {
  return (caixinhas || []).map((cx) =>
    compactarCaixinha({
      ...cx,
      criadoPor: cx.criadoPor || uid,
      depositos: (cx.depositos || []).map((d) => ({
        ...d,
        feitoPor: d.feitoPor || uid,
      })),
    }),
  );
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
  const partnershipDoc = {
    members: [invite.fromUid, meuUid],
    criadoEm: serverTimestamp(),
  };
  if (minhasCaixinhas.length > 0) partnershipDoc.caixinhas = minhasCaixinhas;
  batch.set(partnershipRef, partnershipDoc);
  batch.update(userRef, {
    partnerUid: invite.fromUid,
    partnerNome: invite.fromNome || deleteField(),
    partnershipId: pId,
    caixinhas: deleteField(), // migradas pra partnership
  });
  const inviteUpdate = {
    status: "aceito",
    partnershipId: pId,
  };
  if (meuNome || invite.toNome) inviteUpdate.toNome = meuNome || invite.toNome;
  batch.update(inviteRef, inviteUpdate);
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

  // Notificação "Joana aceitou seu convite!" — adicionada no mesmo update do
  // user doc pra ficar atômica com a finalização do pareamento.
  const notifAceita = {
    id: `np-aceita-${invite.partnershipId}`,
    tipo: "parceria-aceita",
    por: invite.toNome || "Seu parceiro",
    em: new Date().toISOString(),
  };

  const batch = writeBatch(db);
  if (novas.length > 0) {
    batch.update(partnershipRef, { caixinhas: merged });
  }
  batch.update(doc(db, USERS, meuUid), {
    partnerUid: invite.toUid,
    partnerNome: invite.toNome || deleteField(),
    partnershipId: invite.partnershipId,
    caixinhas: deleteField(), // migradas pra partnership
    notificacoesParceria: arrayUnion(notifAceita),
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
// Em vez de deletar a partnership imediatamente, marcamos com `desfeitoPor`.
// Assim o outro lado detecta via snapshot, registra uma notificação no próprio
// user doc e faz o delete final. Isso evita o bug do "segundo desfazer trava"
// (a regra `request.auth.uid in resource.data.members` falhava se o doc já
// não existia).
//
// Se a partnership já não existir (caso raro de race), só limpamos o próprio
// user doc — equivale a um cleanup órfão.
export async function desfazerParceria({
  uid,
  meuNome,
  partnershipId,
  meuEmail,
}) {
  if (!partnershipId) throw new Error("Sem parceria ativa.");
  const pRef = doc(db, PARTNERSHIPS, partnershipId);
  const pDoc = await getDoc(pRef);

  const limparMeuUserSemCaixinhas = () =>
    updateDoc(doc(db, USERS, uid), {
      partnerUid: deleteField(),
      partnerNome: deleteField(),
      partnershipId: deleteField(),
    });

  if (!pDoc.exists()) {
    await limparMeuUserSemCaixinhas();
    if (meuEmail) await definirFlagParceriaNoIndex(uid, meuEmail, false);
    return;
  }

  // Se ela já foi marcada como desfeita por OUTRO (e meu hook ainda não
  // processou), faço o cleanup local também — afinal, eu quis desfazer mesmo.
  const dataP = pDoc.data();
  if (dataP.desfeitoPor && dataP.desfeitoPor !== uid) {
    await limparMeuUserSemCaixinhas();
    if (meuEmail) await definirFlagParceriaNoIndex(uid, meuEmail, false);
    return;
  }

  const caixinhasFinais = compactarCaixinhas(dataP.caixinhas || []);

  const batch = writeBatch(db);
  // Marca a partnership: o outro lado vê pelo snapshot e cria a notificação.
  const updatePartnership = {
    desfeitoPor: uid,
    desfeitoEm: serverTimestamp(),
  };
  if (meuNome) updatePartnership.desfeitoNome = meuNome;
  batch.update(pRef, updatePartnership);
  // Limpa meus campos e levo as caixinhas comigo (combinado da Etapa 1).
  const userUpdate = {
    partnerUid: deleteField(),
    partnerNome: deleteField(),
    partnershipId: deleteField(),
  };
  userUpdate.caixinhas =
    caixinhasFinais.length > 0 ? caixinhasFinais : deleteField();
  batch.update(doc(db, USERS, uid), userUpdate);
  await batch.commit();

  if (meuEmail) await definirFlagParceriaNoIndex(uid, meuEmail, false);
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
export function useSharedCaixinhas({ partnershipId, uid, partnerNome }) {
  const [caixinhas, setCaixinhas] = useState([]);
  const [ready, setReady] = useState(false);
  const [existe, setExiste] = useState(true); // false = partnership foi deletada
  // Quando o outro lado desfez, expomos quem foi pra o app criar a notificação.
  // null = não desfeito; objeto = desfeito por outra pessoa.
  const [desfeito, setDesfeito] = useState(null);
  const caixinhasRef = useRef([]);

  // Detecção de eventos pra gerar notificações ao parceiro:
  //  • inicializadoRef → primeira snapshot é "estado conhecido", não gera notif
  //  • idsConhecidosRef / depsConhecidosRef → conjuntos de IDs já vistos
  //  • Heurística antimigração: se MAIS DE UMA caixinha (ou depósito) novo
  //    chega numa única snapshot, é provável uma migração (ex: parceiro
  //    finalizando pareamento depois) — silenciamos as notifs nesse caso.
  const inicializadoRef = useRef(false);
  const idsConhecidosRef = useRef(new Set());
  const depsConhecidosRef = useRef(new Set());
  // Lê partnerNome via ref pra não re-subscrever quando ele muda.
  const partnerNomeRef = useRef(partnerNome);
  useEffect(() => {
    partnerNomeRef.current = partnerNome;
  }, [partnerNome]);

  useEffect(() => {
    caixinhasRef.current = caixinhas;
  }, [caixinhas]);

  useEffect(() => {
    // Reseta o estado de detecção sempre que troca de partnership.
    inicializadoRef.current = false;
    idsConhecidosRef.current = new Set();
    depsConhecidosRef.current = new Set();

    if (!partnershipId) {
      setCaixinhas([]);
      setReady(false);
      setExiste(true);
      setDesfeito(null);
      return;
    }
    const ref = doc(db, PARTNERSHIPS, partnershipId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setCaixinhas([]);
          setExiste(false);
          setDesfeito(null);
          setReady(true);
          return;
        }
        const d = snap.data();
        const novas = d.caixinhas || [];

        // ── Detecção de eventos ──
        const cxNovas = [];
        const depsNovos = [];
        for (const cx of novas) {
          if (!idsConhecidosRef.current.has(cx.id)) cxNovas.push(cx);
          for (const dep of cx.depositos || []) {
            if (!depsConhecidosRef.current.has(dep.id)) {
              depsNovos.push({ cx, dep });
            }
          }
        }

        // Atualiza conjuntos antes de qualquer notif.
        for (const cx of novas) {
          idsConhecidosRef.current.add(cx.id);
          for (const dep of cx.depositos || []) {
            depsConhecidosRef.current.add(dep.id);
          }
        }

        // Só emite notif depois da primeira snapshot, e só pra UMA novidade por
        // vez (mais que isso costuma ser migração no aceite, não criação real).
        if (inicializadoRef.current) {
          const nome = partnerNomeRef.current || "Seu parceiro";

          if (cxNovas.length === 1) {
            const cx = cxNovas[0];
            if (cx.criadoPor && cx.criadoPor !== uid) {
              adicionarNotifParceria(uid, {
                id: `np-cx-criada-${cx.id}`,
                tipo: "caixinha-criada",
                por: nome,
                caixinhaNome: cx.nome,
                em: new Date().toISOString(),
              });
            }
          }
          if (depsNovos.length === 1) {
            const { cx, dep } = depsNovos[0];
            if (dep.feitoPor && dep.feitoPor !== uid) {
              adicionarNotifParceria(uid, {
                id: `np-dep-${dep.id}`,
                tipo: "caixinha-deposito",
                por: nome,
                caixinhaNome: cx.nome,
                valor: dep.valor,
                em: new Date().toISOString(),
              });
            }
          }
        }
        inicializadoRef.current = true;

        // Atualiza estado/UI.
        setCaixinhas(novas);
        setExiste(true);
        if (d.desfeitoPor && d.desfeitoPor !== uid) {
          setDesfeito({ por: d.desfeitoPor, nome: d.desfeitoNome || "" });
        } else {
          setDesfeito(null);
        }
        setReady(true);
      },
      (err) => console.error("[shared caixinhas]", err),
    );
    return unsub;
  }, [partnershipId, uid]);

  const ref = partnershipId ? doc(db, PARTNERSHIPS, partnershipId) : null;

  const persistir = (novaLista) =>
    updateDoc(ref, {
      caixinhas:
        novaLista.length > 0 ? compactarCaixinhas(novaLista) : deleteField(),
    });

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
    await persistir(novaLista);
  };

  const excluirCaixinha = async (id) => {
    if (!ref) return;
    await persistir(caixinhasRef.current.filter((c) => c.id !== id));
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
    await persistir(novaLista);
  };

  return {
    caixinhas,
    ready,
    existe,
    desfeito,
    salvarCaixinha,
    excluirCaixinha,
    depositarCaixinha,
  };
}

// Detecta dois cenários e faz o cleanup do meu lado:
//
//   1) Parceiro marcou a parceria como desfeita (campo `desfeitoPor` na
//      partnership). → Cria uma notificação no meu user doc, limpa meus campos
//      de parceria, libera o userIndex e deleta a partnership.
//
//   2) Parceria simplesmente não existe mais (legado ou cleanup parcial). →
//      Só limpa meus campos.
//
// Em ambos os casos, usa um `ref` pra evitar processar a mesma parceria mais
// de uma vez (importante no React StrictMode dev e em re-snapshots).
export function useLimparParceriaOrfa({
  uid,
  meuEmail,
  partnershipId,
  partnershipExiste,
  partnershipDesfeito,
}) {
  const tratandoRef = useRef(null);

  useEffect(() => {
    if (!uid || !partnershipId) return;
    if (tratandoRef.current === partnershipId) return;

    // Caso 1: parceiro desfez (e não fui eu).
    if (partnershipDesfeito) {
      tratandoRef.current = partnershipId;
      (async () => {
        try {
          const notif = {
            id: `np-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            tipo: "parceria-desfeita",
            por: partnershipDesfeito.nome || "Seu parceiro",
            em: new Date().toISOString(),
          };
          await updateDoc(doc(db, USERS, uid), {
            partnerUid: deleteField(),
            partnerNome: deleteField(),
            partnershipId: deleteField(),
            notificacoesParceria: arrayUnion(notif),
          });
          if (meuEmail) {
            await definirFlagParceriaNoIndex(uid, meuEmail, false);
          }
          // Cleanup final do doc da partnership (ainda sou membro nesse momento).
          await deleteDoc(doc(db, PARTNERSHIPS, partnershipId));
        } catch (err) {
          console.error("[parceria desfeita pelo parceiro]", err);
        }
      })();
      return;
    }

    // Caso 2: parceria simplesmente sumiu (legado).
    if (partnershipExiste === false) {
      tratandoRef.current = partnershipId;
      (async () => {
        try {
          await updateDoc(doc(db, USERS, uid), {
            partnerUid: deleteField(),
            partnerNome: deleteField(),
            partnershipId: deleteField(),
          });
          if (meuEmail) {
            await definirFlagParceriaNoIndex(uid, meuEmail, false);
          }
        } catch (err) {
          console.error("[limpar parceria órfã]", err);
        }
      })();
    }
  }, [
    uid,
    meuEmail,
    partnershipId,
    partnershipExiste,
    partnershipDesfeito?.por,
  ]);
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
