// export.js — Gera e baixa um .xlsx com os dados do usuário.
// A biblioteca `xlsx` é carregada sob demanda (dynamic import) para não
// pesar o bundle inicial — só quem clica em "Baixar dados" paga o custo.

import { valorAtual } from './caixinhas.js';
import { CATEGORIAS, txDoMes } from '../data.js';

function nomeCategoria(catId) {
  return CATEGORIAS[catId]?.nome || catId || '—';
}

// Nome do usuário virado em pedaço de nome de arquivo (sem acento/espaço).
// Usado tanto pelo .xlsx quanto pelo relatório .pdf.
export function slugNome(nomeUsuario) {
  return (
    (nomeUsuario || 'mycounts')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'mycounts'
  );
}

// Nº de meses entre dois "YYYY-MM" (alvo - início).
function mesesEntre(inicioYYMM, alvoYYMM) {
  const [iy, im] = inicioYYMM.split('-').map(Number);
  const [ay, am] = alvoYYMM.split('-').map(Number);
  return (ay - iy) * 12 + (am - im);
}

// Total de parcelas de uma recorrência: meses de início a fim (inclusive).
// Sem fim definido, a recorrência é indefinida → retorna null.
function totalParcelasRec(rec) {
  if (!rec?.inicio || !rec?.fim) return null;
  const [iy, im] = rec.inicio.split('-').map(Number);
  const [fy, fm] = rec.fim.split('-').map(Number);
  return Math.max(1, (fy - iy) * 12 + (fm - im) + 1);
}

// "Parcela" de uma tx recorrente: qual ocorrência ela é (atual/total). Com
// recorrência indefinida (sem fim), mostra só o número da ocorrência.
function parcelaRec(tx, recMap) {
  if (!tx.recorrenteId) return '';
  const rec = recMap[tx.recorrenteId];
  if (!rec?.inicio) return '';
  const atual = mesesEntre(rec.inicio, tx.data.slice(0, 7)) + 1;
  const total = totalParcelasRec(rec);
  return total ? `${atual}/${total}` : String(atual);
}

function linhaTx(tx, recMap) {
  const ehEntrada = tx.tipo === 'entrada';
  return {
    Data: tx.data,
    Tipo: ehEntrada ? 'Entrada' : 'Gasto',
    Descrição: tx.descricao,
    Categoria: ehEntrada ? '' : nomeCategoria(tx.categoria),
    'Forma de pagamento': ehEntrada ? '' : tx.pagamento || '',
    Valor: Number(tx.valor) || 0,
    Parcela: parcelaRec(tx, recMap),
    'É recorrência': tx.recorrenteId ? 'Sim' : '',
  };
}

function abaTransacoes(XLSX, txs, recorrentes = []) {
  const recMap = {};
  for (const r of recorrentes) recMap[r.id] = r;
  const dados = [...txs]
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((tx) => linhaTx(tx, recMap));
  const ws = XLSX.utils.json_to_sheet(dados);
  // Larguras aproximadas para leitura.
  ws['!cols'] = [
    { wch: 12 }, // Data
    { wch: 10 }, // Tipo
    { wch: 28 }, // Descrição
    { wch: 16 }, // Categoria
    { wch: 20 }, // Pagamento
    { wch: 12 }, // Valor
    { wch: 10 }, // Parcela
    { wch: 14 }, // Recorrência
  ];
  return ws;
}

function abaCaixinhas(XLSX, caixinhas = []) {
  const dados = caixinhas.map((c) => ({
    Nome: c.nome,
    Meta: Number(c.meta) || 0,
    Atual: valorAtual(c),
    'Criada em': c.criadoEm || '',
    'Nº depósitos': (c.depositos || []).length,
  }));
  const ws = XLSX.utils.json_to_sheet(dados);
  ws['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 14 }];
  return ws;
}

function abaDepositosCaixinhas(XLSX, caixinhas = []) {
  const dados = [];
  for (const c of caixinhas) {
    for (const d of c.depositos || []) {
      dados.push({
        Caixinha: c.nome,
        Data: d.data || '',
        Valor: Number(d.valor) || 0,
        Nota: d.nota || '',
      });
    }
  }
  dados.sort((a, b) => (a.Data || '').localeCompare(b.Data || ''));
  const ws = XLSX.utils.json_to_sheet(dados);
  ws['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 30 }];
  return ws;
}

function abaRecorrentes(XLSX, recorrentes = []) {
  const dados = recorrentes.map((r) => ({
    Descrição: r.descricao,
    Tipo: r.tipo === 'entrada' ? 'Entrada' : 'Gasto',
    Categoria: nomeCategoria(r.categoria),
    'Forma de pagamento': r.pagamento || '',
    Valor: Number(r.valor) || 0,
    'Dia do mês': r.dia,
    'Início': r.inicio || '',
    'Último mês gerado': r.ultimoMesGerado || '',
  }));
  const ws = XLSX.utils.json_to_sheet(dados);
  ws['!cols'] = [
    { wch: 28 }, { wch: 10 }, { wch: 16 }, { wch: 20 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 18 },
  ];
  return ws;
}

function abaOrcamentos(XLSX, orcamentos = {}) {
  const dados = Object.entries(orcamentos)
    .filter(([, v]) => Number(v) > 0)
    .map(([catId, valor]) => ({
      Categoria: nomeCategoria(catId),
      'Limite mensal': Number(valor) || 0,
    }));
  const ws = XLSX.utils.json_to_sheet(dados);
  ws['!cols'] = [{ wch: 20 }, { wch: 16 }];
  return ws;
}

// Dispara o download. `mes` = 'YYYY-MM' para mês específico, ou null para "todos".
export async function baixarDadosXLSX({
  txs = [],
  caixinhas = [],
  recorrentes = [],
  orcamentos = {},
  mes = null,
  nomeUsuario = '',
}) {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  if (mes) {
    const filtradas = txDoMes(txs, mes);
    XLSX.utils.book_append_sheet(wb, abaTransacoes(XLSX, filtradas, recorrentes), 'Transações');
  } else {
    XLSX.utils.book_append_sheet(wb, abaTransacoes(XLSX, txs, recorrentes), 'Transações');
    if (caixinhas.length) {
      XLSX.utils.book_append_sheet(wb, abaCaixinhas(XLSX, caixinhas), 'Caixinhas');
      const totalDepositos = caixinhas.reduce(
        (n, c) => n + (c.depositos || []).length,
        0,
      );
      if (totalDepositos > 0) {
        XLSX.utils.book_append_sheet(
          wb,
          abaDepositosCaixinhas(XLSX, caixinhas),
          'Depósitos',
        );
      }
    }
    if (recorrentes.length) {
      XLSX.utils.book_append_sheet(wb, abaRecorrentes(XLSX, recorrentes), 'Recorrentes');
    }
    const temOrc = Object.values(orcamentos).some((v) => Number(v) > 0);
    if (temOrc) {
      XLSX.utils.book_append_sheet(wb, abaOrcamentos(XLSX, orcamentos), 'Orçamentos');
    }
  }

  const rotulo = mes ? mes : 'todos';
  const fileName = `${slugNome(nomeUsuario)}-${rotulo}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
