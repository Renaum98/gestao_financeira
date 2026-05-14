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
} from "./firebase.js";

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
    modo: "claro",
    nome: "",
    fotoUrl: "",
    orcamentoMensal: 0,
    notifLidas: [],
  },
  // ─── Conta compartilhada (Etapa 1: campos existem mas ficam null) ───
  email: null,
  partnerUid: null,
  partnerNome: null,
  partnershipId: null,
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
];

// Garante que o user doc exista e tenha email/userIndex preenchidos. Idempotente.
async function garantirDocInicial(uid) {
  const ref = doc(db, DOC_PATH(uid));
  const snap = await getDoc(ref);
  const u = auth.currentUser;
  const emailLower = (u?.email || "").trim().toLowerCase();

  if (!snap.exists()) {
    // Primeira vez: cria com defaults + email/nome já preenchidos.
    await setDoc(ref, {
      ...DEFAULT_STATE,
      email: emailLower || null,
      preferences: {
        ...DEFAULT_STATE.preferences,
        nome: u?.displayName || "",
      },
    });
  } else if (emailLower && snap.data().email !== emailLower) {
    // Conta antiga sem email registrado — preenche agora.
    await updateDoc(ref, { email: emailLower });
  }

  // Índice por e-mail (pra busca do parceiro). Só escrevemos se mudou.
  if (emailLower) {
    const indexRef = doc(db, INDEX_PATH(emailLower));
    const indexSnap = await getDoc(indexRef);
    const nome = u?.displayName || snap.data()?.preferences?.nome || "";
    if (!indexSnap.exists() || indexSnap.data().uid !== uid) {
      await setDoc(indexRef, { uid, nome });
    } else if (indexSnap.data().nome !== nome && nome) {
      await updateDoc(indexRef, { nome });
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
      if (SYNCED_KEYS.includes(k)) patch[k] = state[k];
    }
    dirtyKeys.current.clear();

    if (Object.keys(patch).length > 0) {
      updateDoc(ref, patch).catch((err) =>
        console.error("[Firestore] falha ao salvar:", err),
      );
    }
  }, [uid, ready, state]);

  // Helper: marca a chave como suja e atualiza só ela no state.
  const patchKey = (key, valOrFn) => {
    dirtyKeys.current.add(key);
    setState((s) => ({
      ...s,
      [key]: typeof valOrFn === "function" ? valOrFn(s[key]) : valOrFn,
    }));
  };

  const setTxs = (v) => patchKey("txs", v);
  const setOrcamentos = (v) => patchKey("orcamentos", v);
  const setCaixinhas = (v) => patchKey("caixinhas", v);
  const setRecorrentes = (v) => patchKey("recorrentes", v);
  const setCategoriasCustom = (v) => patchKey("categoriasCustom", v);
  const setPreferences = (patch) => {
    dirtyKeys.current.add("preferences");
    setState((s) => ({ ...s, preferences: { ...s.preferences, ...patch } }));
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
  };
}
