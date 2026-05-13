// storage.js — hook que sincroniza o estado da app com um documento Firestore.
//
// Estrutura: users/{uid} = { txs, orcamentos, caixinhas, recorrentes, preferences }
// - txs: array de transações
// - orcamentos: objeto { catId: valor }
// - caixinhas: array de objetivos de poupança ({ id, nome, meta?, dataMeta?, cor, depositos })
// - recorrentes: array de modelos de gastos mensais ({ id, descricao, categoria, pagamento, valor, dia, inicio, ultimoMesGerado })
// - preferences: { paleta, modo, nome, orcamentoMensal }

import { useEffect, useRef, useState } from "react";
import { auth, db, doc, getDoc, setDoc, onSnapshot } from "./firebase.js";

const DOC_PATH = (uid) => `users/${uid}`;

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
    orcamentoMensal: 0,
  },
};

export function useCloudState(uid) {
  const [state, setState] = useState(DEFAULT_STATE);
  const [ready, setReady] = useState(false);
  const skipNextWrite = useRef(true); // a primeira atualização vem do snapshot, não escrever de volta

  useEffect(() => {
    if (!uid) return;
    const ref = doc(db, DOC_PATH(uid));

    (async () => {
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, DEFAULT_STATE);
      }
    })();

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        skipNextWrite.current = true;
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
        });
        setReady(true);
      }
    });
    return unsub;
  }, [uid]);

  // Persistir mudanças (com debounce simples por microtask).
  useEffect(() => {
    if (!uid || !ready) return;
    if (skipNextWrite.current) {
      skipNextWrite.current = false;
      return;
    }
    const ref = doc(db, DOC_PATH(uid));
    setDoc(ref, state).catch((err) =>
      console.error("[Firestore] falha ao salvar:", err),
    );
  }, [uid, ready, state]);

  // API: setters parciais por chave (mesma ergonomia do useState).
  const setTxs = (v) =>
    setState((s) => ({ ...s, txs: typeof v === "function" ? v(s.txs) : v }));
  const setOrcamentos = (v) =>
    setState((s) => ({
      ...s,
      orcamentos: typeof v === "function" ? v(s.orcamentos) : v,
    }));
  const setCaixinhas = (v) =>
    setState((s) => ({
      ...s,
      caixinhas: typeof v === "function" ? v(s.caixinhas) : v,
    }));
  const setRecorrentes = (v) =>
    setState((s) => ({
      ...s,
      recorrentes: typeof v === "function" ? v(s.recorrentes) : v,
    }));
  const setCategoriasCustom = (v) =>
    setState((s) => ({
      ...s,
      categoriasCustom: typeof v === "function" ? v(s.categoriasCustom) : v,
    }));
  const setPreferences = (patch) =>
    setState((s) => ({ ...s, preferences: { ...s.preferences, ...patch } }));

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
  };
}
