// storage.js — hook que sincroniza o estado da app com um documento Firestore.
//
// Estrutura: users/{uid} = {
//   txs, orcamentos, caixinhas, recorrentes, categoriasCustom, preferences,
//   email,                                  ← p/ o parceiro encontrar essa conta
//   partnerUid, partnerNome, partnershipId, ← null quando solo
// }
//
// Também mantemos um índice userIndex/{emailLowercase} = { uid, nome } pra que
// um usuário consiga descobrir o uid do parceiro a partir do e-mail dele sem
// precisar ler o doc completo (as Security Rules bloqueiam isso).
//
// Diferente da versão anterior, as escritas agora são GRANULARES (updateDoc com
// apenas os campos que mudaram). Isso evita perder dados quando duas operações
// chegam quase simultâneas — fundamental pra Etapa 2 em diante (parceria).

import { useEffect, useRef, useState } from "react";
import {
  auth,
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  deleteField,
} from "./firebase.js";
import { compactarPorChave } from "./compact.js";
import { estaOffline } from "./conexao.js";

const DOC_PATH = (uid) => `users/${uid}`;
const INDEX_PATH = (emailLower) => `userIndex/${emailLower}`;

const DEFAULT_STATE = {
  txs: [],
  // Todas as categorias começam zeradas; o usuário define quanto quer gastar em cada uma.
  orcamentos: {
    alimentacao: 0,
    transporte: 0,
    moradia: 0,
    lazer: 0,
    saude: 0,
    compras: 0,
    educacao: 0,
    assinaturas: 0,
    outros: 0,
  },
  caixinhas: [],
  recorrentes: [],
  categoriasCustom: [],
  preferences: {
    paleta: "#6E4FF6",
    modo: "sistema",
    idioma: "pt",
    moeda: "BRL",
    nome: "",
    fotoUrl: "",
    orcamentoMensal: 0,
    orcamentoCartaoCredito: 0,
    notifLidas: [],
  },
  // ─── Conta compartilhada (Etapa 1: campos existem mas ficam null) ───
  email: null,
  partnerUid: null,
  partnerNome: null,
  partnershipId: null,
  // Eventos da parceria (ex: parceiro desfez) que precisam ser mostrados ao
  // usuário. São limpos quando ele dispensa.
  notificacoesParceria: [],
};

// Chaves que o `state` local sincroniza com o Firestore. As chaves de parceria
// (partnerUid, partnerNome, partnershipId, email) são escritas por fluxos
// dedicados (Etapa 2+), não pelo state local — por isso ficam fora daqui.
const SYNCED_KEYS = [
  "txs",
  "orcamentos",
  "caixinhas",
  "recorrentes",
  "categoriasCustom",
  "preferences",
  "notificacoesParceria",
];

// Garante que o user doc exista e tenha email/userIndex preenchidos. Idempotente.
// Doc inicial é mínimo: só `email` (e `preferences.nome` se houver).
// Todos os outros campos (txs, orcamentos, caixinhas, recorrentes…) ficam
// ausentes e a leitura completa via DEFAULT_STATE.
async function garantirDocInicial(uid) {
  const ref = doc(db, DOC_PATH(uid));
  const snap = await getDoc(ref);
  const u = auth.currentUser;
  const emailLower = (u?.email || "").trim().toLowerCase();
  const nomeUsuario = u?.displayName || "";

  if (!snap.exists()) {
    const inicial = {};
    if (emailLower) inicial.email = emailLower;
    if (nomeUsuario) inicial.preferences = { nome: nomeUsuario };
    await setDoc(ref, inicial);
  } else if (emailLower && snap.data().email !== emailLower) {
    // Conta antiga sem email registrado — preenche agora.
    await updateDoc(ref, { email: emailLower });
  }

  // Índice por e-mail (pra busca do parceiro). Só salva `temParceiro` quando
  // for true — ausência do campo equivale a false.
  if (emailLower) {
    const indexRef = doc(db, INDEX_PATH(emailLower));
    const indexSnap = await getDoc(indexRef);
    const nome = nomeUsuario || snap.data()?.preferences?.nome || "";
    const temParceiro = !!snap.data()?.partnerUid;
    if (!indexSnap.exists() || indexSnap.data().uid !== uid) {
      const docIndice = { uid };
      if (nome) docIndice.nome = nome;
      if (temParceiro) docIndice.temParceiro = true;
      await setDoc(indexRef, docIndice);
    } else {
      const patch = {};
      if (indexSnap.data().nome !== nome && nome) patch.nome = nome;
      const flagAtual = indexSnap.data().temParceiro === true;
      if (temParceiro && !flagAtual) patch.temParceiro = true;
      else if (!temParceiro && flagAtual) patch.temParceiro = deleteField();
      if (Object.keys(patch).length) await updateDoc(indexRef, patch);
    }
  }
}

export function useCloudState(uid) {
  const [state, setState] = useState(DEFAULT_STATE);
  const [ready, setReady] = useState(false);
  const skipNextWrite = useRef(true); // primeira atualização vem do snapshot
  const dirtyKeys = useRef(new Set()); // quais campos precisam ser persistidos

  useEffect(() => {
    if (!uid) return;
    const ref = doc(db, DOC_PATH(uid));

    garantirDocInicial(uid).catch((err) =>
      console.error("[Firestore] inicialização:", err),
    );

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        skipNextWrite.current = true;
        dirtyKeys.current.clear();
        setState({
          txs: data.txs ?? [],
          orcamentos: {
            ...DEFAULT_STATE.orcamentos,
            ...(data.orcamentos ?? {}),
          },
          caixinhas: data.caixinhas ?? [],
          recorrentes: data.recorrentes ?? [],
          categoriasCustom: data.categoriasCustom ?? [],
          preferences: {
            ...DEFAULT_STATE.preferences,
            ...(data.preferences ?? {}),
          },
          email: data.email ?? null,
          partnerUid: data.partnerUid ?? null,
          partnerNome: data.partnerNome ?? null,
          partnershipId: data.partnershipId ?? null,
          notificacoesParceria: data.notificacoesParceria ?? [],
        });
        setReady(true);
      }
    });
    return unsub;
  }, [uid]);

  // Persistir apenas o que mudou (updateDoc granular).
  useEffect(() => {
    if (!uid || !ready) return;
    if (skipNextWrite.current) {
      skipNextWrite.current = false;
      return;
    }
    if (dirtyKeys.current.size === 0) return;

    const ref = doc(db, DOC_PATH(uid));
    const patch = {};
    for (const k of dirtyKeys.current) {
      if (SYNCED_KEYS.includes(k)) patch[k] = compactarPorChave(k, state[k]);
    }
    dirtyKeys.current.clear();

    if (Object.keys(patch).length > 0) {
      updateDoc(ref, patch).catch((err) =>
        console.error("[Firestore] falha ao salvar:", err),
      );
    }
  }, [uid, ready, state]);

  // Helper: marca a chave como suja e atualiza só ela no state.
  //
  // Sem conexão, nada é alterado — nem no state local. Essa é a trava central
  // que garante a regra "a nuvem sempre prevalece": se o state local nunca
  // diverge do servidor enquanto estamos offline, não existe array velho pra
  // ser enfileirado e sobrescrever o que outro aparelho gravou. Devolve false
  // pra quem chamou saber que não salvou; a UI usa isso pra avisar o usuário.
  const patchKey = (key, valOrFn) => {
    if (estaOffline()) return false;
    dirtyKeys.current.add(key);
    setState((s) => ({
      ...s,
      [key]: typeof valOrFn === "function" ? valOrFn(s[key]) : valOrFn,
    }));
    return true;
  };

  const setTxs = (v) => patchKey("txs", v);
  const setOrcamentos = (v) => patchKey("orcamentos", v);
  const setCaixinhas = (v) => patchKey("caixinhas", v);
  const setRecorrentes = (v) => patchKey("recorrentes", v);
  const setCategoriasCustom = (v) => patchKey("categoriasCustom", v);
  const setNotificacoesParceria = (v) => patchKey("notificacoesParceria", v);
  const setPreferences = (patch) => {
    if (estaOffline()) return false;
    dirtyKeys.current.add("preferences");
    setState((s) => ({ ...s, preferences: { ...s.preferences, ...patch } }));
    return true;
  };

  return {
    ready,
    txs: state.txs,
    setTxs,
    orcamentos: state.orcamentos,
    setOrcamentos,
    caixinhas: state.caixinhas,
    setCaixinhas,
    recorrentes: state.recorrentes,
    setRecorrentes,
    categoriasCustom: state.categoriasCustom,
    setCategoriasCustom,
    preferences: state.preferences,
    setPreferences,
    // Campos novos da Etapa 1 — read-only por enquanto:
    email: state.email,
    partnerUid: state.partnerUid,
    partnerNome: state.partnerNome,
    partnershipId: state.partnershipId,
    notificacoesParceria: state.notificacoesParceria,
    setNotificacoesParceria,
  };
}
