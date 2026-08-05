// data.js — categorias, pagamentos, helpers de formatação e agregação.

import { getMoeda } from './lib/moeda.js';

export const CATEGORIAS = {
  alimentacao: { id: 'alimentacao', nome: 'Alimentação', cor: '#FF9B6E', corFundo: '#FFEEDF', emoji: 'A' },
  transporte:  { id: 'transporte',  nome: 'Transporte',  cor: '#5DA8FF', corFundo: '#E0EFFF', emoji: 'T' },
  moradia:     { id: 'moradia',     nome: 'Moradia',     cor: '#9B7BFF', corFundo: '#ECE4FF', emoji: 'M' },
  lazer:       { id: 'lazer',       nome: 'Lazer',       cor: '#FF7AA8', corFundo: '#FFE0EC', emoji: 'L' },
  saude:       { id: 'saude',       nome: 'Saúde',       cor: '#3FCB9A', corFundo: '#DAF5E9', emoji: 'S' },
  compras:     { id: 'compras',     nome: 'Compras',     cor: '#F0C13B', corFundo: '#FBF1CF', emoji: 'C' },
  educacao:    { id: 'educacao',    nome: 'Educação',    cor: '#6FB8D9', corFundo: '#DDEEF5', emoji: 'E' },
  assinaturas: { id: 'assinaturas', nome: 'Assinaturas', cor: '#C58BFF', corFundo: '#F0E0FF', emoji: 'A' },
  financiamento: { id: 'financiamento', nome: 'Financiamento', cor: '#5B6CFF', corFundo: '#E2E6FF', emoji: 'F' },
  outros:      { id: 'outros',      nome: 'Outros',      cor: '#B3AAB8', corFundo: '#EBE7EE', emoji: 'O' },
};

// Id da categoria de financiamento — ao usá-la, o modal de gasto habilita o
// reajuste composto por parcela (ver valorRecNoMes) e liga "repetir todo mês".
export const CAT_FINANCIAMENTO = 'financiamento';

export const ORDEM_CATS = ['alimentacao','transporte','financiamento','moradia','lazer','saude','compras','educacao','assinaturas','outros'];

// ─── Categorias personalizadas ───
// O usuário pode criar categorias com nome + cor; o "logo" é a primeira letra do nome.
// Ficam guardadas no Firestore e, no boot, são mescladas em CATEGORIAS / ORDEM_CATS
// via aplicarCategoriasCustom() — assim todo o app (CatChip, telas, análises) funciona sem mudanças.
//
// Em contas com parceria, mesclamos também as categorias do parceiro pra
// conseguir RENDERIZAR as txs dele com o nome/cor certos. Mas o usuário
// não deve ver as categorias do parceiro como opção para criar uma tx
// nova, filtrar, ou definir um orçamento. Para isso, marcamos as
// categorias do parceiro com `doParceiro: true` durante o merge — quem
// quer listar "só as minhas" usa `catsMinhas()`.

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

export function aplicarCategoriasCustom(lista, opts = {}) {
  const doParceiro = !!opts.doParceiro;
  for (const c of lista || []) {
    if (!c || !c.id) continue;
    // Em colisão de id, a entrada do usuário sempre vence: se já existe
    // uma entrada não-do-parceiro com este id, não sobrescrevemos.
    const existente = CATEGORIAS[c.id];
    if (doParceiro && existente && !existente.doParceiro) continue;
    CATEGORIAS[c.id] = {
      id: c.id,
      nome: c.nome,
      cor: c.cor,
      corFundo: c.corFundo || (c.cor + '22'),
      custom: true,
      ...(doParceiro && { doParceiro: true }),
    };
    if (!ORDEM_CATS.includes(c.id)) {
      // Insere antes de "outros" para manter "outros" como último.
      const i = ORDEM_CATS.indexOf('outros');
      if (i >= 0) ORDEM_CATS.splice(i, 0, c.id);
      else ORDEM_CATS.push(c.id);
    }
  }
}

// Retorna a ordem de categorias visíveis ao usuário corrente, omitindo
// as que vieram do parceiro. Usado em todas as superfícies de criação
// e descoberta (picker de tx, filtros, orçamentos, gráfico de análise).
export function catsMinhas() {
  return ORDEM_CATS.filter((c) => !CATEGORIAS[c]?.doParceiro);
}

export const PAGAMENTOS = ['Cartão de crédito','Cartão de débito','Pix','Dinheiro'];

export const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
export const MESES_CURTO = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

// Paletas de destaque. Todas calibradas pra dar contraste ≥3 com texto branco
// nos dois extremos do gradiente (primary → primary2). Pra ler:
//
//   • primary  → cor sólida usada em texto colorido (chips, links, ícones)
//   • primary2 → segunda parada do gradiente nos cards/botões grandes
//
// O texto sobre o gradiente é sempre branco; saturação/luminância das duas
// cores são mantidas próximas pra que o branco continue legível ao longo do
// degradê todo.
//
// `primaryDark` / `primary2Dark` são as variantes do tema escuro, e TODAS as
// paletas têm — resolvidas por coresDaPaleta(), logo abaixo.
//
// Por que existem: a calibragem original mirava um alvo só, o branco sobre o
// gradiente, e isso empurra as cores pro escuro. Só que a mesma cor faz um
// segundo trabalho — texto pequeno colorido (12/13px) sobre o fundo — que no
// tema escuro pede o contrário. Com um valor só, as seis coloridas ficavam
// entre 2,91:1 e 3,92:1 sobre o `--card` escuro, todas abaixo dos 4,5:1 que
// texto pequeno exige. As variantes abaixo são a menor clareada que fecha os
// dois lados, com folga:
//
//   • ≥ 4,65:1 contra o --card (#1F1B26) e o --bg (#13101A) escuros
//   • ≥ 3,25:1 com o branco por cima, nas DUAS pontas do gradiente
//
// Matiz e saturação não mudam — só a luminância —, então a identidade de cada
// cor continua a mesma. O efeito colateral é um gradiente mais raso no escuro
// (salto de ~1,13× de luminância em vez de ~1,5×): as duas pontas ficam
// espremidas entre o piso do texto e o teto do branco. É o preço de os dois
// papéis dividirem o mesmo par de tokens.
export const PALETAS = [
  {
    primary: '#6E4FF6', primary2: '#8C72FF',
    primaryDark: '#8A71F8', primary2Dark: '#9279FF',
    nome: 'Violeta',
  },
  {
    primary: '#D44B3F', primary2: '#E66659',
    primaryDark: '#D96156', primary2Dark: '#E6675A',
    nome: 'Coral',
  },
  {
    primary: '#0E8554', primary2: '#1FA970',
    // o primary2 claro já estava no teto do branco: no escuro ele se repete
    primaryDark: '#109A61', primary2Dark: '#1FA970',
    nome: 'Esmeralda',
  },
  {
    primary: '#2563EA', primary2: '#487EE8',
    primaryDark: '#5283EE', primary2Dark: '#5C8CEB',
    nome: 'Oceano',
  },
  {
    primary: '#A26200', primary2: '#C97C0E',
    primaryDark: '#C17500', primary2Dark: '#CA7D0E',
    nome: 'Mostarda',
  },
  {
    primary: '#B8208A', primary2: '#D43DAA',
    primaryDark: '#E04AB2', primary2Dark: '#DC60B9',
    nome: 'Rosa',
  },
  {
    primary: '#1A1416',
    primary2: '#3D3338',
    // Caso extremo da regra acima: aqui a paleta não só clareia, ela inverte —
    // em vez de preto sobre claro, vira prata sobre preto, a mesma ideia "noir"
    // do outro lado. O grafite que estava aqui (#4A3D44) dava 1,83:1 contra o
    // --bg #13101A: sumia.
    //
    // O teto do branco é o que impede ir até o branco de verdade: o texto e os
    // ícones em cima do gradiente são brancos em 25 lugares do app (o + da tab
    // bar, os cards de destaque, os botões grandes). Então a prata fica na faixa
    // que atende os dois lados:
    //
    //   #8B8189  →  5,0:1 contra o fundo   |  3,8:1 com o branco por cima
    //   #998E96  →  6,0:1 contra o fundo   |  3,2:1 com o branco por cima
    //
    // O tom puxa um pouco pro mauve em vez de cinza neutro pra casar com o roxo
    // do --bg escuro.
    primaryDark: '#8B8189',
    primary2Dark: '#998E96',
    nome: 'Preto',
  },
];

// Resolve as duas cores de uma paleta pro tema ativo. Uma paleta só declara as
// variantes Dark quando a versão clara não sobrevive ao fundo escuro (hoje só a
// "Preto"); as outras usam as mesmas cores nos dois temas.
//
// Quem pinta com a paleta deve passar por aqui — inclusive o seletor de cor da
// tela de Aparência, senão a bolinha mostra uma cor e o app aplica outra.
export function coresDaPaleta(pal, ehEscuro) {
  return {
    primary: (ehEscuro && pal.primaryDark) || pal.primary,
    primary2: (ehEscuro && pal.primary2Dark) || pal.primary2,
  };
}

// Formatação monetária localizada. A moeda ativa (símbolo + formato) vem de
// lib/moeda.js. O nome `fmtBRL` é histórico — hoje formata na moeda escolhida.
export function fmtBRL(v) {
  const m = getMoeda();
  try {
    return new Intl.NumberFormat(m.locale, {
      style: 'currency',
      currency: m.codigo,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(v || 0);
  } catch {
    return `${m.simbolo} ${(v || 0).toFixed(2)}`;
  }
}

export function fmtBRLCompacto(v) {
  const m = getMoeda();
  if (Math.abs(v) >= 1000) {
    let n;
    try {
      n = new Intl.NumberFormat(m.locale, { maximumFractionDigits: 1 }).format(v / 1000);
    } catch {
      n = (v / 1000).toFixed(1);
    }
    return `${m.simbolo} ${n}k`;
  }
  return fmtBRL(v);
}

// Valor de uma recorrência num mês específico. Para recorrências comuns é
// sempre o mesmo valor. Para financiamentos com reajuste (campo `crescimento`,
// ex.: 0.015 = 1,5% por parcela), aplica juros compostos sobre a parcela base:
//   parcela_i = base × (1 + crescimento)^i
// onde i é o nº de meses desde `mesBase` (âncora — início, ou o mês de uma
// edição). A 1ª parcela (i=0) é exatamente a base digitada.
export function valorRecNoMes(r, yyyymm) {
  if (!r) return 0;
  const base = r.valorBase != null ? r.valorBase : r.valor;
  if (!r.crescimento) return base;
  const ref = r.mesBase || r.inicio;
  if (!ref) return base;
  const [iy, im] = ref.split('-').map(Number);
  const [ty, tm] = yyyymm.split('-').map(Number);
  const offset = (ty - iy) * 12 + (tm - im);
  if (offset <= 0) return Math.round(base * 100) / 100;
  return Math.round(base * Math.pow(1 + r.crescimento, offset) * 100) / 100;
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

// Versões traduzíveis: recebem a função `t` (de useT) e localizam o nome do
// mês. Sem `t`, comportam-se como as originais (português).
export function rotuloMesT(t, yyyymm) {
  const [a, m] = yyyymm.split('-');
  const nome = MESES[parseInt(m, 10) - 1];
  return `${t ? t(nome) : nome} ${a}`;
}

export function rotuloMesCurto(yyyymm) {
  const [a, m] = yyyymm.split('-');
  return `${MESES_CURTO[parseInt(m,10) - 1]} ${a.slice(2)}`;
}

export function rotuloMesCurtoT(t, yyyymm) {
  const [a, m] = yyyymm.split('-');
  const nome = MESES_CURTO[parseInt(m, 10) - 1];
  return `${t ? t(nome) : nome} ${a.slice(2)}`;
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
