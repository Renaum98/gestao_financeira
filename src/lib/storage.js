// storage.js — hook que sincroniza o estado da app com um documento Firestore.
//
// Estrutura: users/{uid} = { txs, orcamentos, preferences }
// - txs: array de transações
// - orcamentos: objeto { catId: valor }
// - preferences: { paleta, modo, nome }

import { useEffect, useRef, useState } from 'react';
import { auth, db, doc, getDoc, setDoc, onSnapshot } from './firebase.js';

const DOC_PATH = (uid) => `users/${uid}`;

const DEFAULT_STATE = {
  txs: [],
  orcamentos: {
    alimentacao: 900, transporte: 400, moradia: 1500, lazer: 350,
    saude: 250, compras: 500, educacao: 300, assinaturas: 150, outros: 200,
  },
  preferences: {
    paleta: '#6E4FF6',
    modo: 'claro',
    nome: '',
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
          orcamentos: { ...DEFAULT_STATE.orcamentos, ...(data.orcamentos ?? {}) },
          preferences: { ...DEFAULT_STATE.preferences, ...(data.preferences ?? {}) },
        });
        setReady(true);
      }
    });
    return unsub;
  }, [uid]);

  // Persistir mudanças (com debounce simples por microtask).
  useEffect(() => {
    if (!uid || !ready) return;
    if (skipNextWrite.current) { skipNextWrite.current = false; return; }
    const ref = doc(db, DOC_PATH(uid));
    setDoc(ref, state).catch((err) => console.error('[Firestore] falha ao salvar:', err));
  }, [uid, ready, state]);

  // API: setters parciais por chave (mesma ergonomia do useState).
  const setTxs        = (v) => setState((s) => ({ ...s, txs:        typeof v === 'function' ? v(s.txs)        : v }));
  const setOrcamentos = (v) => setState((s) => ({ ...s, orcamentos: typeof v === 'function' ? v(s.orcamentos) : v }));
  const setPreferences = (patch) => setState((s) => ({ ...s, preferences: { ...s.preferences, ...patch } }));

  return {
    ready,
    txs: state.txs, setTxs,
    orcamentos: state.orcamentos, setOrcamentos,
    preferences: state.preferences, setPreferences,
  };
}
