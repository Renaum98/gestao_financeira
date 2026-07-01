// utils.js — helpers de prazo usados nas seções de notificações.

export function diasAte(yyyymmdd) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const [y, m, d] = yyyymmdd.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return Math.ceil((dt - hoje) / (1000 * 60 * 60 * 24));
}

export function rotuloPrazo(n) {
  return n <= 0 ? 'Hoje' : n === 1 ? 'Amanhã' : `Em ${n} dias`;
}

// Versão traduzível: recebe a função `t` (de useT).
export function rotuloPrazoT(t, n) {
  return n <= 0 ? t('Hoje') : n === 1 ? t('Amanhã') : t('Em {n} dias', { n });
}
