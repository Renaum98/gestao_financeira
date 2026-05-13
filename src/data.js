// data.js — categorias, pagamentos, helpers de formatação e agregação.

export const CATEGORIAS = {
  alimentacao: { id: 'alimentacao', nome: 'Alimentação', cor: '#FF9B6E', corFundo: '#FFEEDF', emoji: 'A' },
  transporte:  { id: 'transporte',  nome: 'Transporte',  cor: '#5DA8FF', corFundo: '#E0EFFF', emoji: 'T' },
  moradia:     { id: 'moradia',     nome: 'Moradia',     cor: '#9B7BFF', corFundo: '#ECE4FF', emoji: 'M' },
  lazer:       { id: 'lazer',       nome: 'Lazer',       cor: '#FF7AA8', corFundo: '#FFE0EC', emoji: 'L' },
  saude:       { id: 'saude',       nome: 'Saúde',       cor: '#3FCB9A', corFundo: '#DAF5E9', emoji: 'S' },
  compras:     { id: 'compras',     nome: 'Compras',     cor: '#F0C13B', corFundo: '#FBF1CF', emoji: 'C' },
  educacao:    { id: 'educacao',    nome: 'Educação',    cor: '#6FB8D9', corFundo: '#DDEEF5', emoji: 'E' },
  assinaturas: { id: 'assinaturas', nome: 'Assinaturas', cor: '#C58BFF', corFundo: '#F0E0FF', emoji: 'A' },
  outros:      { id: 'outros',      nome: 'Outros',      cor: '#B3AAB8', corFundo: '#EBE7EE', emoji: 'O' },
};

export const ORDEM_CATS = ['alimentacao','transporte','moradia','lazer','saude','compras','educacao','assinaturas','outros'];

// ─── Categorias personalizadas ───
// O usuário pode criar categorias com nome + cor; o "logo" é a primeira letra do nome.
// Ficam guardadas no Firestore e, no boot, são mescladas em CATEGORIAS / ORDEM_CATS
// via aplicarCategoriasCustom() — assim todo o app (CatChip, telas, análises) funciona sem mudanças.

export function novaCategoriaCustom(nome, cor) {
  const limpo = String(nome || '').trim() || 'Categoria';
  return {
    id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    nome: limpo,
    cor: cor || '#B3AAB8',
    corFundo: (cor || '#B3AAB8') + '22', // tom claro (hex de 8 dígitos = +alpha)
    custom: true,
  };
}

export function aplicarCategoriasCustom(lista) {
  for (const c of lista || []) {
    if (!c || !c.id) continue;
    CATEGORIAS[c.id] = {
      id: c.id,
      nome: c.nome,
      cor: c.cor,
      corFundo: c.corFundo || (c.cor + '22'),
      custom: true,
    };
    if (!ORDEM_CATS.includes(c.id)) {
      // Insere antes de "outros" para manter "outros" como último.
      const i = ORDEM_CATS.indexOf('outros');
      if (i >= 0) ORDEM_CATS.splice(i, 0, c.id);
      else ORDEM_CATS.push(c.id);
    }
  }
}

export const PAGAMENTOS = ['Cartão de crédito','Cartão de débito','Pix','Dinheiro'];

export const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
export const MESES_CURTO = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

export const PALETAS = [
  { primary: '#3a19cf', primary2: '#5f5192', nome: 'Violeta' },
  { primary: '#EF6B5C', primary2: '#FFA98B', nome: 'Coral' },
  { primary: '#1B9E6A', primary2: '#5BD8A0', nome: 'Esmeralda' },
  { primary: '#2566EA', primary2: '#6BA6FF', nome: 'Oceano' },
  { primary: '#E08A00', primary2: '#FFC766', nome: 'Mostarda' },
  { primary: '#e000d5', primary2: '#ff66f2', nome: 'Rosa' },
];

export function fmtBRL(v, ocultar = false) {
  if (ocultar) return 'R$ •••••';
  const sign = v < 0 ? '-' : '';
  const abs = Math.abs(v);
  const [int, dec] = abs.toFixed(2).split('.');
  const intF = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}R$ ${intF},${dec}`;
}

export function fmtBRLCompacto(v, ocultar = false) {
  if (ocultar) return 'R$ •••';
  if (Math.abs(v) >= 1000) {
    return `R$ ${(v / 1000).toFixed(1).replace('.', ',')}k`;
  }
  return fmtBRL(v);
}

export function txDoMes(txs, yyyymm) {
  return txs.filter(t => t.data.startsWith(yyyymm));
}

export function chaveMes(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,'0')}`;
}

export function rotuloMes(yyyymm) {
  const [a, m] = yyyymm.split('-');
  return `${MESES[parseInt(m,10) - 1]} ${a}`;
}

export function rotuloMesCurto(yyyymm) {
  const [a, m] = yyyymm.split('-');
  return `${MESES_CURTO[parseInt(m,10) - 1]} ${a.slice(2)}`;
}

export function totalPorCategoria(txs) {
  const m = {};
  for (const t of txs) {
    if (t.tipo === 'entrada') continue;
    m[t.categoria] = (m[t.categoria] || 0) + t.valor;
  }
  return m;
}

export function totalGeral(txs) {
  return txs.reduce((s, t) => (t.tipo === 'entrada' ? s : s + t.valor), 0);
}

export function totalEntradas(txs) {
  return txs.reduce((s, t) => (t.tipo === 'entrada' ? s + t.valor : s), 0);
}

// Retorna a lista de meses (yyyy-mm) presentes nas transações + o mês atual,
// ordenados do mais recente para o mais antigo.
export function listarMeses(txs) {
  const set = new Set(txs.map(t => t.data.slice(0, 7)));
  set.add(chaveMes(new Date()));
  return Array.from(set).sort((a, b) => b.localeCompare(a));
}
