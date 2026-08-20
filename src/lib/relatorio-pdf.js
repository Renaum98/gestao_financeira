// relatorio-pdf.js — Relatório mensal em PDF (transações do mês).
//
// Diferente do .xlsx (dados crus pra planilha), aqui a saída é um documento
// formatado pra ler/imprimir/enviar: cabeçalho com a marca, resumo do mês,
// tabela de transações e um fechamento por categoria.
//
// Só existe versão POR MÊS — um relatório "de tudo" viraria um calhamaço sem
// leitura útil; pra isso o usuário baixa o .xlsx.
//
// O documento é monocromático de propósito (ver a paleta abaixo): num extrato
// é o número que informa, e a cor só concorria com ele.
//
// O resumo sai de `calcularSaldoMes`, a mesma conta do Dashboard: o restante do
// mês é orçamento fixo + entradas - guardado em caixinhas + diferença trazida
// do mês anterior - gastos. Duplicar a fórmula aqui só criaria um relatório que
// discorda da tela.
//
// Como no export.js, o `jspdf` entra por dynamic import: só quem gera relatório
// paga o custo no bundle.

import { CATEGORIAS, fmtBRL, rotuloMesT, txDoMes } from '../data.js';
import { slugNome } from './export.js';
import { calcularSaldoMes } from './saldo-mes.js';
import { mesAnteriorDe } from './datas.js';

// ─── Medidas (mm, A4 retrato) ───
const LARG = 210;
const ALT = 297;
const MARGEM = 14;
const LARG_UTIL = LARG - MARGEM * 2; // 182
const RODAPE = 18; // faixa reservada no pé da página

// ─── Tinta do documento ───
// Fixas (não seguem o tema do app): papel é sempre claro.
//
// A paleta é cinza de ponta a ponta, de propósito. Num extrato o SINAL já diz
// se o dinheiro entrou ou saiu, e o tamanho da barra já diz o peso da
// categoria — pintar isso de verde/vermelho/roxo repetia em cor o que o número
// dizia melhor, e o que sobrava era enfeite competindo com a leitura. O único
// respingo de cor no papel é o logo, que identifica o documento.
//
// Hierarquia: TINTA para o que se lê (valores, nomes), SUAVE para apoio,
// FRACO para rótulo de coluna, LINHA para filete, BARRA para preenchimento.
const TINTA = '#1A141F';
const SUAVE = '#6B6470';
const FRACO = '#9A939F';
const LINHA = '#DEDAE3';
const BARRA = '#5A5460';

function rgb(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function texto(doc, cor) {
  doc.setTextColor(...rgb(cor));
}

function preencher(doc, cor) {
  doc.setFillColor(...rgb(cor));
}

// Colunas da tabela de transações (soma = LARG_UTIL).
const COLS = [
  { chave: 'data', larg: 14 },
  { chave: 'descricao', larg: 66 },
  { chave: 'categoria', larg: 30 },
  { chave: 'pagamento', larg: 34 },
  { chave: 'valor', larg: 38, dir: 'right' },
];

// Corta o texto com reticências pra caber em `largMax` (mm).
function cortar(doc, valor, largMax) {
  const s = String(valor ?? '');
  if (!s || doc.getTextWidth(s) <= largMax) return s;
  let corte = s;
  while (corte.length > 1 && doc.getTextWidth(`${corte}…`) > largMax) {
    corte = corte.slice(0, -1);
  }
  return `${corte}…`;
}

// Lado do logo (px) já embutido no PDF. O logo.png original é 1600×1600 e o
// jsPDF embute PNG como bitmap cru — jogar o arquivo inteiro lá dentro faz um
// relatório de 2 páginas passar de 7 MB. Reamostramos num canvas: 128px é bem
// mais do que os ~14 mm que o logo ocupa no papel, mesmo impresso a 300 dpi.
const LADO_LOGO = 128;

// Logo em data URL. O `addImage` do jsPDF não aceita URL remota, então
// buscamos o PNG, reduzimos e convertemos. Se falhar (offline, 404), o
// cabeçalho cai no wordmark só em texto — o relatório sai mesmo assim.
async function carregarLogo() {
  try {
    const base = import.meta.env?.BASE_URL || '/';
    const resp = await fetch(`${base}logo.png`);
    if (!resp.ok) return null;
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    try {
      const img = await new Promise((ok, falhou) => {
        const i = new Image();
        i.onload = () => ok(i);
        i.onerror = falhou;
        i.src = url;
      });
      const canvas = document.createElement('canvas');
      canvas.width = LADO_LOGO;
      canvas.height = LADO_LOGO;
      const cv = canvas.getContext('2d');
      cv.drawImage(img, 0, 0, LADO_LOGO, LADO_LOGO);
      return canvas.toDataURL('image/png');
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch {
    return null;
  }
}

// ─── Cabeçalho ───
// Página 1 leva o cabeçalho completo; as seguintes, uma faixa compacta.
// Em ambos o logo fica no canto superior esquerdo.

function cabecalhoCompleto(ctx, { mesRotulo, nomeUsuario, geradoEm }) {
  const { doc, logo, t } = ctx;

  if (logo) doc.addImage(logo, 'PNG', MARGEM, 13, 14, 14);

  const xTexto = logo ? MARGEM + 19 : MARGEM;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  texto(doc, TINTA);
  doc.text('MyCounts', xTexto, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  texto(doc, SUAVE);
  doc.text(t('Relatório mensal'), xTexto, 25.5);

  // Bloco da direita: mês do relatório + quando foi gerado.
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  texto(doc, TINTA);
  doc.text(mesRotulo, LARG - MARGEM, 20, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  texto(doc, SUAVE);
  const linhaInfo = nomeUsuario
    ? `${nomeUsuario} · ${t('Gerado em {data}', { data: geradoEm })}`
    : t('Gerado em {data}', { data: geradoEm });
  doc.text(linhaInfo, LARG - MARGEM, 25.5, { align: 'right' });

  // Um filete fino e escuro fecha o cabeçalho. A faixa grossa colorida de
  // antes pesava mais que o próprio título.
  doc.setDrawColor(...rgb(TINTA));
  doc.setLineWidth(0.4);
  doc.line(MARGEM, 31, LARG - MARGEM, 31);

  ctx.y = 40;
}

function cabecalhoCompacto(ctx, mesRotulo) {
  const { doc, logo, t } = ctx;

  if (logo) doc.addImage(logo, 'PNG', MARGEM, 12, 9, 9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  texto(doc, TINTA);
  doc.text('MyCounts', logo ? MARGEM + 12 : MARGEM, 18.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  texto(doc, SUAVE);
  doc.text(`${t('Relatório mensal')} · ${mesRotulo}`, LARG - MARGEM, 18.5, { align: 'right' });

  doc.setDrawColor(...rgb(LINHA));
  doc.setLineWidth(0.3);
  doc.line(MARGEM, 23, LARG - MARGEM, 23);

  ctx.y = 31;
}

function novaPagina(ctx) {
  ctx.doc.addPage();
  cabecalhoCompacto(ctx, ctx.mesRotulo);
}

// Garante `precisa` mm livres antes do rodapé; senão vira a página.
function garantirEspaco(ctx, precisa) {
  if (ctx.y + precisa > ALT - RODAPE) novaPagina(ctx);
}

function tituloSecao(ctx, rotulo) {
  const { doc } = ctx;
  garantirEspaco(ctx, 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  texto(doc, SUAVE);
  doc.text(rotulo.toUpperCase(), MARGEM, ctx.y);
  ctx.y += 5;
}

// ─── Resumo do mês ───
// Quatro números: o orçamento fixo do mês, as entradas extras, o que foi gasto
// e o restante — a mesma linha de fundo que o Dashboard mostra. Guardado em
// caixinhas e diferença trazida do mês anterior entram na conta do restante,
// mas viram uma linha de detalhe: só aparecem quando existem, senão o leitor
// não consegue fechar a soma de cabeça.
function blocoResumo(ctx, resumo) {
  const { doc, t } = ctx;
  const { orcBase, entradas, gastos, guardado, carryover, restante, mesAnterior } = resumo;
  // Sem cor por coluna: o sinal na frente do número já diz a direção, e
  // "entradas" verde ao lado de "gastos" vermelho tirava o olho justamente do
  // que interessa, que é a comparação entre os quatro valores.
  const colunas = [
    { rotulo: t('Orçamento do mês'), valor: fmtBRL(orcBase) },
    { rotulo: t('Entradas'), valor: `+ ${fmtBRL(entradas)}` },
    { rotulo: t('Gastos'), valor: `- ${fmtBRL(gastos)}` },
    { rotulo: t('Restante'), valor: fmtBRL(restante) },
  ];

  const vao = 4;
  const largCol = (LARG_UTIL - vao * (colunas.length - 1)) / colunas.length;
  const altBloco = 16;
  garantirEspaco(ctx, altBloco + 4);

  colunas.forEach((c, i) => {
    const x = MARGEM + i * (largCol + vao);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    texto(doc, FRACO);
    doc.text(cortar(doc, c.rotulo.toUpperCase(), largCol - 2), x, ctx.y + 4);

    doc.setFontSize(12);
    texto(doc, TINTA);
    doc.text(cortar(doc, c.valor, largCol - 2), x, ctx.y + 12);
  });

  ctx.y += altBloco;

  const detalhes = [];
  if (guardado > 0.005) {
    detalhes.push(`${t('Guardado em caixinhas')} -${fmtBRL(guardado)}`);
  }
  if (Math.abs(carryover) > 0.005) {
    const rotulo = t('Diferença de {mes}', { mes: rotuloMesT(t, mesAnterior) });
    detalhes.push(`${rotulo} ${carryover < 0 ? '-' : '+'}${fmtBRL(Math.abs(carryover))}`);
  }
  if (detalhes.length) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    texto(doc, SUAVE);
    doc.text(`${t('Também na conta do restante')}: ${detalhes.join(' · ')}`, MARGEM, ctx.y + 2);
    ctx.y += 5;
  }

  ctx.y += 6;
}

// ─── Tabela de transações ───

function cabecalhoTabela(ctx) {
  const { doc, t } = ctx;
  const rotulos = {
    data: t('Data'),
    descricao: t('Descrição'),
    categoria: t('Categoria'),
    pagamento: t('Pagamento'),
    valor: t('Valor'),
  };

  // Rótulos soltos entre dois filetes, no lugar da barra preta com texto
  // branco: o cabeçalho para de ser o elemento mais pesado da página e vira o
  // que ele é, uma legenda das colunas.
  doc.setDrawColor(...rgb(TINTA));
  doc.setLineWidth(0.3);
  doc.line(MARGEM, ctx.y, LARG - MARGEM, ctx.y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  texto(doc, FRACO);

  let x = MARGEM;
  for (const col of COLS) {
    const rotulo = rotulos[col.chave].toUpperCase();
    if (col.dir === 'right') doc.text(rotulo, x + col.larg - 3, ctx.y + 5, { align: 'right' });
    else doc.text(cortar(doc, rotulo, col.larg - 4), x + 3, ctx.y + 5);
    x += col.larg;
  }

  ctx.y += 7.5;
  doc.setDrawColor(...rgb(LINHA));
  doc.setLineWidth(0.2);
  doc.line(MARGEM, ctx.y, LARG - MARGEM, ctx.y);
}

function linhaTabela(ctx, tx) {
  const { doc, t } = ctx;
  const altLinha = 7;

  if (ctx.y + altLinha > ALT - RODAPE) {
    novaPagina(ctx);
    cabecalhoTabela(ctx);
  }

  const ehEntrada = tx.tipo === 'entrada';
  const [, mm, dd] = tx.data.split('-');
  const cat = CATEGORIAS[tx.categoria];
  const celulas = {
    data: `${dd}/${mm}`,
    descricao: tx.descricao || '—',
    categoria: ehEntrada ? '—' : t(cat?.nome || tx.categoria || '—'),
    pagamento: ehEntrada ? '—' : t(tx.pagamento || '—'),
    valor: `${ehEntrada ? '+' : '-'} ${fmtBRL(Number(tx.valor) || 0)}`,
  };

  const yTexto = ctx.y + 4.7;
  let x = MARGEM;
  for (const col of COLS) {
    if (col.chave === 'valor') {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      texto(doc, TINTA);
      doc.text(celulas.valor, x + col.larg - 3, yTexto, { align: 'right' });
    } else {
      doc.setFont('helvetica', col.chave === 'descricao' ? 'bold' : 'normal');
      doc.setFontSize(7.5);
      texto(doc, col.chave === 'descricao' ? TINTA : SUAVE);
      doc.text(cortar(doc, celulas[col.chave], col.larg - 6), x + 3, yTexto);
    }
    x += col.larg;
  }

  ctx.y += altLinha;

  // Filete no lugar da faixa zebrada: guia o olho pela linha sem pintar
  // metade da tabela de lilás.
  doc.setDrawColor(...rgb(LINHA));
  doc.setLineWidth(0.2);
  doc.line(MARGEM, ctx.y, LARG - MARGEM, ctx.y);
}

// Fecha a tabela somando o que está listado nela — nada de orçamento aqui, pra
// não misturar com o resumo lá em cima.
function totalTabela(ctx, { entradas, gastos }) {
  const { doc, t } = ctx;
  const altLinha = 9;
  if (ctx.y + altLinha > ALT - RODAPE) novaPagina(ctx);

  // Filete escuro: é o que fecha a tabela, então pesa um pouco mais que os
  // separadores de linha.
  doc.setDrawColor(...rgb(TINTA));
  doc.setLineWidth(0.3);
  doc.line(MARGEM, ctx.y, LARG - MARGEM, ctx.y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  texto(doc, TINTA);
  doc.text(t('Total lançado no mês'), MARGEM + 3, ctx.y + 6);

  doc.text(`+ ${fmtBRL(entradas)}`, LARG - MARGEM - 48, ctx.y + 6, { align: 'right' });
  doc.text(`- ${fmtBRL(gastos)}`, LARG - MARGEM - 3, ctx.y + 6, { align: 'right' });

  ctx.y += altLinha + 6;
}

// ─── Gastos por categoria ───
function blocoCategorias(ctx, gastosPorCat, totalGastos) {
  const { doc, t } = ctx;
  const linhas = Object.entries(gastosPorCat)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);
  if (!linhas.length) return;

  tituloSecao(ctx, t('Gastos por categoria'));

  // Sem a bolinha e sem a barra na cor da categoria: aqui a informação é o
  // peso de cada uma no total, e o comprimento da barra já diz isso. A cor
  // (dez tons diferentes empilhados) só disputava atenção com ele.
  for (const [catId, valor] of linhas) {
    garantirEspaco(ctx, 9);
    const cat = CATEGORIAS[catId];
    const pct = totalGastos > 0 ? valor / totalGastos : 0;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    texto(doc, TINTA);
    doc.text(cortar(doc, t(cat?.nome || catId), 50), MARGEM, ctx.y + 3);

    // Barrinha proporcional ao peso da categoria no total de gastos.
    const xBarra = MARGEM + 56;
    const largBarra = 62;
    preencher(doc, LINHA);
    doc.rect(xBarra, ctx.y + 1.3, largBarra, 1.8, 'F');
    if (pct > 0) {
      preencher(doc, BARRA);
      doc.rect(xBarra, ctx.y + 1.3, Math.max(1.2, largBarra * pct), 1.8, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    texto(doc, SUAVE);
    doc.text(`${Math.round(pct * 100)}%`, xBarra + largBarra + 8, ctx.y + 3, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    texto(doc, TINTA);
    doc.text(fmtBRL(valor), LARG - MARGEM, ctx.y + 3, { align: 'right' });

    ctx.y += 8;
  }

  ctx.y += 4;
}

// Rodapé em todas as páginas — só dá pra numerar depois de saber o total.
function rodapes(ctx) {
  const { doc, t } = ctx;
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setDrawColor(...rgb(LINHA));
    doc.setLineWidth(0.3);
    doc.line(MARGEM, ALT - 13, LARG - MARGEM, ALT - 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    texto(doc, SUAVE);
    doc.text(t('Gerado pelo MyCounts'), MARGEM, ALT - 8.5);
    doc.text(
      t('Página {n} de {total}', { n: i, total }),
      LARG - MARGEM,
      ALT - 8.5,
      { align: 'right' },
    );
  }
}

// Gera e baixa o relatório do mês `mes` ('YYYY-MM').
// `preferences`, `caixinhas`, `todosMeses` e `meuUid` alimentam o resumo — sem
// eles a conta cai pra "entradas - gastos", que é o relatório sem orçamento.
export async function baixarRelatorioPDF({
  txs = [],
  caixinhas = [],
  preferences = {},
  todosMeses = [],
  meuUid = null,
  partnerUid = null,
  mes,
  nomeUsuario = '',
  lang = 'pt',
  t = (s) => s,
}) {
  if (!mes) throw new Error('relatório PDF exige um mês');

  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
  const logo = await carregarLogo();

  const doMes = txDoMes(txs, mes).sort((a, b) => a.data.localeCompare(b.data));

  const gastosPorCat = {};
  for (const tx of doMes) {
    if (tx.tipo === 'entrada') continue;
    const valor = Number(tx.valor) || 0;
    gastosPorCat[tx.categoria] = (gastosPorCat[tx.categoria] || 0) + valor;
  }

  // Mesma conta do Dashboard. O parceiro fica de fora: o relatório é do extrato
  // de quem baixou, e `partnerUid` entra só pra não contar como meu o que o
  // parceiro guardou nas caixinhas compartilhadas.
  const saldo = calcularSaldoMes(mes, {
    txs,
    partnerTxs: [],
    todosMeses,
    preferences,
    caixinhas,
    meuUid,
    partnerUid,
    orcBaseParceiro: 0,
  });
  const resumo = {
    orcBase: saldo.orcBase,
    entradas: saldo.entradas,
    gastos: saldo.total,
    guardado: saldo.guardado,
    carryover: saldo.carryover,
    restante: saldo.restante,
    mesAnterior: mesAnteriorDe(mes),
  };

  const mesRotulo = rotuloMesT(t, mes);
  const ctx = { doc, logo, t, y: 0, mesRotulo };

  const geradoEm = new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'pt-BR');
  cabecalhoCompleto(ctx, { mesRotulo, nomeUsuario, geradoEm });

  tituloSecao(ctx, t('Resumo do mês'));
  blocoResumo(ctx, resumo);

  tituloSecao(ctx, t('Transações ({n})', { n: doMes.length }));
  if (doMes.length) {
    cabecalhoTabela(ctx);
    for (const tx of doMes) linhaTabela(ctx, tx);
    totalTabela(ctx, { entradas: resumo.entradas, gastos: resumo.gastos });
    blocoCategorias(ctx, gastosPorCat, resumo.gastos);
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    texto(doc, SUAVE);
    doc.text(t('Nenhuma transação neste mês.'), MARGEM, ctx.y + 2);
    ctx.y += 10;
  }

  rodapes(ctx);
  doc.save(`${slugNome(nomeUsuario)}-relatorio-${mes}.pdf`);
}
