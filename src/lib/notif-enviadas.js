// notif-enviadas.js — o registro local de "já avisei sobre isto".
//
// É um Set de ids no localStorage, por aparelho. Serve a dois módulos que
// não podem depender um do outro: notifications.js (o disparo local grava
// o que mostrou) e push.js (sincroniza este registro com o da assinatura
// de push no Firestore, pra que o servidor não repita o que o app já
// mostrou aqui e vice-versa).

const ENVIADAS_KEY = 'finca.notif.enviadas';

export function lerEnviadas() {
  try {
    const raw = localStorage.getItem(ENVIADAS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

// Grava mantendo só IDs ainda ativos para não crescer indefinidamente.
export function gravarEnviadas(set, idsAtivos) {
  const ativos = new Set(idsAtivos);
  const limpo = [...set].filter((id) => ativos.has(id));
  try {
    localStorage.setItem(ENVIADAS_KEY, JSON.stringify(limpo));
  } catch {}
}

// Acrescenta ids ao registro sem podar — quem chama não sabe o que está
// ativo (é o caso da lista que vem do servidor). A poda acontece na próxima
// gravação normal.
export function mesclarEnviadas(ids) {
  if (!ids || ids.length === 0) return;
  const set = lerEnviadas();
  for (const id of ids) set.add(id);
  try {
    localStorage.setItem(ENVIADAS_KEY, JSON.stringify([...set]));
  } catch {}
}
