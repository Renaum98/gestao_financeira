// relatorio-pdf.js — Relatório mensal em PDF (transações do mês).
//
// Diferente do .xlsx (dados crus pra planilha), aqui a saída é um documento
// formatado pra ler/imprimir/enviar: cabeçalho com a marca, resumo do mês,
// tabela de transações e um fechamento por categoria.
//
// Só existe versão POR MÊS — um relatório "de tudo" viraria um calhamaço sem
// leitura útil; pra isso o usuário baixa o .xlsx.
//
// Como no export.js, o `jspdf` entra por dynamic import: só quem gera relatório
// paga o custo no bundle.

import { CATEGORIAS, fmtBRL, rotuloMesT, txDoMes } from '../data.js';
import { COR_NEG, COR_POS } from './colors.js';
import { slugNome } from './export.js';

// ─── Medidas (mm, A4 retrato) ───
const LARG = 210;
const ALT = 297;
const MARGEM = 14;
const LARG_UTIL = LARG - MARGEM * 2; // 182
const RODAPE = 18; // faixa reservada no pé da página

// ─── Cores do documento ───
// Fixas (não seguem o tema do app): papel é sempre claro.
const MARCA = '#6E4FF6';
const TINTA = '#1A141F';
const SUAVE = '#6B6470';
const LINHA = '#E3DEE9';
const ZEBRA = '#F7F4FA';

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
  texto(doc, MARCA);
  doc.text(mesRotulo, LARG - MARGEM, 20, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  texto(doc, SUAVE);
  const linhaInfo = nomeUsuario
    ? `${nomeUsuario} · ${t('Gerado em {data}', { data: geradoEm })}`
    : t('Gerado em {data}', { data: geradoEm });
  doc.text(linhaInfo, LARG - MARGEM, 25.5, { align: 'right' });

  doc.setDrawColor(...rgb(MARCA));
  doc.setLineWidth(0.8);
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
// Três caixas: entradas, gastos e o resultado (entradas - gastos) das
// transações do mês. É um fechamento do extrato, não o "saldo do mês" do app
// (que envolve orçamento fixo, guardado e carryover).
function blocoResumo(ctx, { entradas, gastos }) {
  const { doc, t } = ctx;
  const resultado = entradas - gastos;
  const caixas = [
    { rotulo: t('Entradas'), valor: entradas, cor: COR_POS },
    { rotulo: t('Gastos'), valor: gastos, cor: COR_NEG },
    { rotulo: t('Resultado'), valor: resultado, cor: resultado < 0 ? COR_NEG : TINTA },
  ];

  const vao = 4;
  const largCol = (LARG_UTIL - vao * (caixas.length - 1)) / caixas.length;
  const altBloco = 16;
  garantirEspaco(ctx, altBloco + 4);

  caixas.forEach((c, i) => {
    const x = MARGEM + i * (largCol + vao);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    texto(doc, SUAVE);
    doc.text(c.rotulo.toUpperCase(), x, ctx.y + 4);

    doc.setFontSize(12);
    texto(doc, c.cor);
    doc.text(cortar(doc, fmtBRL(c.valor), largCol - 2), x, ctx.y + 12);
  });

  ctx.y += altBloco + 6;
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

  preencher(doc, TINTA);
  doc.roundedRect(MARGEM, ctx.y, LARG_UTIL, 8, 1.5, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);

  let x = MARGEM;
  for (const col of COLS) {
    const rotulo = rotulos[col.chave];
    if (col.dir === 'right') doc.text(rotulo, x + col.larg - 3, ctx.y + 5.4, { align: 'right' });
    else doc.text(cortar(doc, rotulo, col.larg - 4), x + 3, ctx.y + 5.4);
    x += col.larg;
  }

  ctx.y += 8;
  ctx.zebra = false;
}

function linhaTabela(ctx, tx) {
  const { doc, t } = ctx;
  const altLinha = 7;

  if (ctx.y + altLinha > ALT - RODAPE) {
    novaPagina(ctx);
    cabecalhoTabela(ctx);
  }

  if (ctx.zebra) {
    preencher(doc, ZEBRA);
    doc.rect(MARGEM, ctx.y, LARG_UTIL, altLinha, 'F');
  }
  ctx.zebra = !ctx.zebra;

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
      texto(doc, ehEntrada ? COR_POS : TINTA);
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
}

function totalTabela(ctx, { entradas, gastos }) {
  const { doc, t } = ctx;
  const altLinha = 9;
  if (ctx.y + altLinha > ALT - RODAPE) novaPagina(ctx);

  doc.setDrawColor(...rgb(LINHA));
  doc.setLineWidth(0.3);
  doc.line(MARGEM, ctx.y, LARG - MARGEM, ctx.y);

  const resultado = entradas - gastos;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  texto(doc, TINTA);
  doc.text(t('Resultado do mês'), MARGEM + 3, ctx.y + 6);
  texto(doc, resultado < 0 ? COR_NEG : COR_POS);
  doc.text(fmtBRL(resultado), LARG - MARGEM - 3, ctx.y + 6, { align: 'right' });

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

  for (const [catId, valor] of linhas) {
    garantirEspaco(ctx, 9);
    const cat = CATEGORIAS[catId];
    const pct = totalGastos > 0 ? valor / totalGastos : 0;

    // Marcador com a cor da categoria.
    preencher(doc, cat?.cor || '#B3AAB8');
    doc.circle(MARGEM + 1.6, ctx.y + 2.2, 1.6, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    texto(doc, TINTA);
    doc.text(cortar(doc, t(cat?.nome || catId), 46), MARGEM + 6, ctx.y + 3);

    // Barrinha proporcional ao peso da categoria no total de gastos.
    const xBarra = MARGEM + 56;
    const largBarra = 62;
    preencher(doc, LINHA);
    doc.roundedRect(xBarra, ctx.y + 1, largBarra, 2.4, 1.2, 1.2, 'F');
    if (pct > 0) {
      preencher(doc, cat?.cor || '#B3AAB8');
      doc.roundedRect(xBarra, ctx.y + 1, Math.max(1.5, largBarra * pct), 2.4, 1.2, 1.2, 'F');
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
export async function baixarRelatorioPDF({
  txs = [],
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

  let entradas = 0;
  let gastos = 0;
  const gastosPorCat = {};
  for (const tx of doMes) {
    const valor = Number(tx.valor) || 0;
    if (tx.tipo === 'entrada') {
      entradas += valor;
    } else {
      gastos += valor;
      gastosPorCat[tx.categoria] = (gastosPorCat[tx.categoria] || 0) + valor;
    }
  }

  const mesRotulo = rotuloMesT(t, mes);
  const ctx = { doc, logo, t, y: 0, zebra: false, mesRotulo };

  const geradoEm = new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'pt-BR');
  cabecalhoCompleto(ctx, { mesRotulo, nomeUsuario, geradoEm });

  tituloSecao(ctx, t('Resumo do mês'));
  blocoResumo(ctx, { entradas, gastos });

  tituloSecao(ctx, t('Transações ({n})', { n: doMes.length }));
  if (doMes.length) {
    cabecalhoTabela(ctx);
    for (const tx of doMes) linhaTabela(ctx, tx);
    totalTabela(ctx, { entradas, gastos });
    blocoCategorias(ctx, gastosPorCat, gastos);
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
