// data.js — categorias, pagamentos, helpers de formatação e agregação.

import { mesCorrente } from './lib/datas.js';
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
  {
    // A única paleta em que o par não são dois tons da mesma cor, e sim duas
    // cores diferentes — daí a marca `par`, que faz as superfícies sólidas de
    // destaque virarem gradiente (ver `fundoDaPaleta`). Nas outras isso não
    // faria sentido: um degradê entre dois tons vizinhos só suja a cor chapada.
    //
    // O amarelo é terroso, e não o da bandeira, por causa do branco que vai por
    // cima: #FFDF00 dá 1,33:1 com branco, ilegível. Este #B8860B dá 3,25:1, bem
    // no meio da faixa em que os primary2 das outras paletas vivem (3,0 a 4,2)
    // — e é mais legível do que o miolo violeta que o app usa hoje, em 2,88:1.
    // O verde, a 5,06:1, cai na mesma faixa dos outros primary.
    //
    // No card de destaque o amarelo é o miolo e o verde o corpo: o número grande
    // atravessa os dois, e nenhum dos dois o engole.
    par: true,
    primary: '#00803A', primary2: '#B8860B',
    // No escuro o verde clareia pra continuar visível contra o --bg (#13101A):
    // 5,06:1 contra o fundo, espelhando o que a Esmeralda faz. O amarelo já
    // estava no teto do branco, então se repete — mesmo caso da Esmeralda.
    primaryDark: '#00994A', primary2Dark: '#B8860B',
    nome: 'Brasil',
  },
  {
    // Vermelho → âmbar. O âmbar veio como #FFC500 e teve de descer: com branco
    // por cima ele dá 1,59:1, e numa paleta `par` a segunda cor é o MIOLO do
    // card de destaque, bem onde o número grande fica. Este #BE8600 dá 3,18:1,
    // dentro da faixa em que os primary2 do app vivem (3,0 a 4,2). O vermelho
    // passou intacto: 6,17:1 com branco por cima e os mesmos 6,17:1 quando ele
    // pinta texto sobre o card claro, que é o outro papel do primary.
    par: true,
    primary: '#C21500', primary2: '#BE8600',
    primaryDark: '#F04C37', primary2Dark: '#BE8600',
    nome: 'Fogo',
  },
  {
    // Violeta → coral. O violeta veio como pedido, 6,82:1 nos dois papéis. O
    // coral veio #FF5555 e desceu um passo de luminosidade, com o matiz
    // intacto: em cima do card ele gritava mais que a primeira cor. Em
    // #F2494B fica 3,60:1 com branco — no meio da faixa dos primary2, junto do
    // violeta da paleta padrão — e 5,22:1 contra o fundo escuro, que é onde as
    // variantes dark de todas as outras paletas caem. Por isso ele se repete
    // no escuro em vez de ganhar uma clara própria.
    par: true,
    primary: '#6025F5', primary2: '#F2494B',
    primaryDark: '#8E6EFF', primary2Dark: '#F2494B',
    nome: 'Sky Clean',
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

// O fundo de uma superfície sólida de destaque — botão cheio, chip ativo, o “+”
// da tab bar. Quase sempre é a cor chapada; numa paleta `par` (duas cores
// diferentes) vira o degradê entre as duas, no mesmo ângulo
// que os botões grandes do app já usam pro par.
//
// Vale como valor de `background` nos dois casos: a propriedade aceita tanto
// uma cor quanto uma imagem, então quem consome escreve sempre o mesmo.
export function fundoDaPaleta(pal, ehEscuro) {
  const { primary, primary2 } = coresDaPaleta(pal, ehEscuro);
  return pal.par ? `linear-gradient(135deg, ${primary}, ${primary2})` : primary;
}

// O fundo do card de destaque — gradiente vertical, do tom claro no topo até o
// escuro na base. Fica aqui, e não no componente, porque a receita depende de a
// paleta ser `par` ou não, e só este arquivo sabe disso.
//
// Numa paleta comum o claro é só um realce e se dissolve cedo: as duas cores
// são tons vizinhos, e dar área demais ao claro foi o que deixava o número
// grande ilegível (o miolo violeta dá 2,88:1 com branco).
//
// Numa paleta `par` a segunda cor NÃO é realce, é a identidade — dissolvida cedo
// ela some e o card inteiro vira a primeira cor. Então ela segura uma faixa no
// topo e a primeira cor só fecha em 60% da altura. Dá pra fazer isso porque
// toda segunda cor de paleta `par` é escolhida na faixa de 3,0 a 4,2:1 com
// branco — ou seja, mais legível que o miolo que causou o problema.
//
// A base escura é a mesma de sempre: 72% da cor com preto. Num gradiente
// vertical ela vira uma faixa no pé do card, que é justamente onde o rodapé de
// números mora — texto branco ali só ganha contraste.
export function heroDaPaleta(pal, ehEscuro) {
  const { primary, primary2 } = coresDaPaleta(pal, ehEscuro);
  const base = `color-mix(in oklab, ${primary} 72%, #000)`;
  const topo = pal.par ? `${primary2} 0%, ${primary2} 16%` : `${primary2} 0%`;
  const corpo = pal.par ? '60%' : '45%';
  return `linear-gradient(to bottom, ${topo}, ${primary} ${corpo}, ${base} 100%)`;
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
  set.add(mesCorrente());
  return Array.from(set).sort((a, b) => b.localeCompare(a));
}
