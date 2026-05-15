// insights.jsx — gera o banco de variações de insights pro card rotativo
// na tela Início. Cada candidato testa suas pré-condições; quem tiver dados
// suficientes entra na lista. Quanto mais variações entrarem, mais o card
// "respira" e parece vivo a cada ciclo de 10s.
//
// Função pura: recebe os números/objetos já calculados pela tela e devolve
// um array de { icon, cor, texto }. O `texto` é JSX (com strongs/cores) pra
// a tela renderizar direto.

import { CATEGORIAS, fmtBRLCompacto, totalPorCategoria } from '../data.js';
import { COR_POS, COR_NEG, COR_AVISO } from './colors.js';

function topCat(mapa) {
  const ents = Object.entries(mapa).filter(([, v]) => v > 0);
  if (!ents.length) return null;
  ents.sort((a, b) => b[1] - a[1]);
  const [id, valor] = ents[0];
  return CATEGORIAS[id]
    ? { id, valor, nome: CATEGORIAS[id].nome, cor: CATEGORIAS[id].cor }
    : null;
}

export function computeInsights({
  txMes,
  txMesAnt,
  total,
  totalAnt,
  delta,
  ocultar,
  mes,
  orcTotal,
  restante,
  entradas,
  caixinhas,
  proximas,
  orcCategorias,
}) {
  const out = [];
  const porCatAnt = totalPorCategoria(txMesAnt);
  const porCatAtual = totalPorCategoria(txMes);

  // ─── 1) Top categoria do mês passado (contexto) ───
  const topAnt = topCat(porCatAnt);
  if (topAnt && totalAnt > 0) {
    const pct = Math.round((topAnt.valor / totalAnt) * 100);
    out.push({
      icon: 'history',
      cor: topAnt.cor,
      texto: (
        <>
          No mês passado você gastou mais em{' '}
          <strong style={{ color: 'var(--ink)' }}>{topAnt.nome}</strong> —{' '}
          {fmtBRLCompacto(topAnt.valor, ocultar)} ({pct}% do total).
        </>
      ),
    });
  }

  // ─── 2) Variação % vs mês anterior ───
  if (totalAnt > 0 && total > 0) {
    const diff = Math.round(Math.abs(delta));
    if (diff >= 5) {
      const subiu = total > totalAnt;
      out.push({
        icon: subiu ? 'chart' : 'sparkle',
        cor: subiu ? COR_NEG : COR_POS,
        texto: (
          <>
            Você está gastando{' '}
            <strong style={{ color: subiu ? COR_NEG : COR_POS }}>
              {diff}% {subiu ? 'a mais' : 'a menos'}
            </strong>{' '}
            que no mês passado.
          </>
        ),
      });
    }
  }

  // ─── 3) Categoria que mais cresceu mês a mês ───
  if (topAnt && Object.keys(porCatAtual).length) {
    let maiorAlta = null;
    for (const id of Object.keys(porCatAtual)) {
      const atual = porCatAtual[id] || 0;
      const ant = porCatAnt[id] || 0;
      if (atual > ant && ant > 0) {
        const cresc = ((atual - ant) / ant) * 100;
        if (!maiorAlta || cresc > maiorAlta.cresc) {
          maiorAlta = { id, cresc, atual, ant, ...CATEGORIAS[id] };
        }
      }
    }
    if (maiorAlta && maiorAlta.cresc >= 20) {
      out.push({
        icon: 'target',
        cor: maiorAlta.cor || 'var(--primary)',
        texto: (
          <>
            Sua maior alta foi em{' '}
            <strong style={{ color: 'var(--ink)' }}>{maiorAlta.nome}</strong>{' '}
            (+{Math.round(maiorAlta.cresc)}%).
          </>
        ),
      });
    }
  }

  // ─── 4) Categoria que mais economizou ───
  if (topAnt && Object.keys(porCatAnt).length) {
    let maiorQueda = null;
    for (const id of Object.keys(porCatAnt)) {
      const ant = porCatAnt[id] || 0;
      const atual = porCatAtual[id] || 0;
      if (ant > 0 && atual < ant) {
        const queda = ((ant - atual) / ant) * 100;
        if (!maiorQueda || queda > maiorQueda.queda) {
          maiorQueda = { id, queda, atual, ant, ...CATEGORIAS[id] };
        }
      }
    }
    if (maiorQueda && maiorQueda.queda >= 20) {
      out.push({
        icon: 'sparkle',
        cor: COR_POS,
        texto: (
          <>
            Você economizou{' '}
            <strong style={{ color: COR_POS }}>
              {Math.round(maiorQueda.queda)}%
            </strong>{' '}
            em{' '}
            <strong style={{ color: 'var(--ink)' }}>{maiorQueda.nome}</strong>{' '}
            vs. o mês passado.
          </>
        ),
      });
    }
  }

  // ─── 5) Top categoria atual (peso no mês) ───
  const topAtual = topCat(porCatAtual);
  if (topAtual && total > 0) {
    const pct = Math.round((topAtual.valor / total) * 100);
    out.push({
      icon: 'chart',
      cor: topAtual.cor,
      texto: (
        <>
          Sua maior categoria este mês é{' '}
          <strong style={{ color: 'var(--ink)' }}>{topAtual.nome}</strong> —{' '}
          {pct}% dos gastos.
        </>
      ),
    });
  }

  // ─── 6) Ritmo + projeção de fim de mês ───
  // Só faz sentido quando o mês exibido é o atual (não tem como projetar
  // mês passado), e quando já passou pelo menos 1 dia.
  {
    const hoje = new Date();
    const mesAtualKey = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
    const ehMesCorrente = mes === mesAtualKey;
    if (ehMesCorrente && total > 0) {
      const diaHoje = hoje.getDate();
      const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
      const mediaDia = total / diaHoje;
      const projecao = mediaDia * diasNoMes;
      out.push({
        icon: 'chart',
        cor: 'var(--primary)',
        texto: (
          <>
            No ritmo atual ({fmtBRLCompacto(mediaDia, ocultar)}/dia), você vai
            fechar o mês em{' '}
            <strong style={{ color: 'var(--ink)' }}>
              {fmtBRLCompacto(projecao, ocultar)}
            </strong>
            .
          </>
        ),
      });
    }
  }

  // ─── 7) Restante do orçamento por dia ───
  {
    const hoje = new Date();
    const mesAtualKey = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
    const ehMesCorrente = mes === mesAtualKey;
    if (ehMesCorrente && orcTotal > 0 && restante > 0) {
      const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
      const diasRest = Math.max(1, diasNoMes - hoje.getDate() + 1);
      const porDia = restante / diasRest;
      out.push({
        icon: 'target',
        cor: COR_POS,
        texto: (
          <>
            Restam {diasRest} {diasRest === 1 ? 'dia' : 'dias'} no mês — dá
            pra gastar até{' '}
            <strong style={{ color: COR_POS }}>
              {fmtBRLCompacto(porDia, ocultar)}/dia
            </strong>{' '}
            sem estourar o orçamento.
          </>
        ),
      });
    } else if (orcTotal > 0 && restante < 0) {
      out.push({
        icon: 'bell',
        cor: COR_NEG,
        texto: (
          <>
            Você passou{' '}
            <strong style={{ color: COR_NEG }}>
              {fmtBRLCompacto(Math.abs(restante), ocultar)}
            </strong>{' '}
            do orçamento deste mês.
          </>
        ),
      });
    }
  }

  // ─── 8) Maior gasto único do mês ───
  {
    const maior = txMes.reduce(
      (a, t) => (t.tipo === 'entrada' ? a : !a || t.valor > a.valor ? t : a),
      null,
    );
    if (maior && total > 0) {
      const pctTotal = Math.round((maior.valor / total) * 100);
      if (pctTotal >= 8) {
        out.push({
          icon: 'card',
          cor: CATEGORIAS[maior.categoria]?.cor || 'var(--primary)',
          texto: (
            <>
              Seu maior gasto foi{' '}
              <strong style={{ color: 'var(--ink)' }}>{maior.descricao}</strong>{' '}
              — {fmtBRLCompacto(maior.valor, ocultar)} ({pctTotal}% do mês).
            </>
          ),
        });
      }
    }
  }

  // ─── 9) Caixinhas: total guardado ou progresso de meta ───
  if (caixinhas && caixinhas.length > 0) {
    const guardadoTotal = caixinhas.reduce(
      (s, c) =>
        s + (c.depositos || []).reduce((s2, d) => s2 + (d.valor > 0 ? d.valor : 0), 0),
      0,
    );
    // Encontra a caixinha com meta mais próxima de bater.
    const comMeta = caixinhas
      .filter((c) => c.meta > 0)
      .map((c) => {
        const atual = (c.depositos || []).reduce((s, d) => s + d.valor, 0);
        return { ...c, atual, pct: (atual / c.meta) * 100 };
      })
      .filter((c) => c.pct < 100)
      .sort((a, b) => b.pct - a.pct);

    if (comMeta.length > 0 && comMeta[0].pct >= 30) {
      const c = comMeta[0];
      out.push({
        icon: 'piggy',
        cor: c.cor || 'var(--primary)',
        texto: (
          <>
            <strong style={{ color: 'var(--ink)' }}>{c.nome}</strong> está com{' '}
            <strong style={{ color: c.cor || 'var(--primary)' }}>
              {Math.round(c.pct)}%
            </strong>{' '}
            da meta — faltam {fmtBRLCompacto(c.meta - c.atual, ocultar)}.
          </>
        ),
      });
    } else if (guardadoTotal > 0) {
      out.push({
        icon: 'piggy',
        cor: 'var(--primary)',
        texto: (
          <>
            Você já guardou{' '}
            <strong style={{ color: 'var(--ink)' }}>
              {fmtBRLCompacto(guardadoTotal, ocultar)}
            </strong>{' '}
            em {caixinhas.length}{' '}
            {caixinhas.length === 1 ? 'caixinha' : 'caixinhas'}.
          </>
        ),
      });
    }
  }

  // ─── 10) Saúde financeira: entradas vs gastos ───
  if (entradas > 0 && total > 0) {
    const saldo = entradas - total;
    const taxaPoupanca = Math.round((saldo / entradas) * 100);
    if (saldo > 0 && taxaPoupanca >= 5) {
      out.push({
        icon: 'sparkle',
        cor: COR_POS,
        texto: (
          <>
            Suas entradas cobrem os gastos com{' '}
            <strong style={{ color: COR_POS }}>{taxaPoupanca}% de folga</strong>{' '}
            ({fmtBRLCompacto(saldo, ocultar)} sobrando).
          </>
        ),
      });
    } else if (saldo < 0) {
      out.push({
        icon: 'bell',
        cor: COR_NEG,
        texto: (
          <>
            Os gastos superaram as entradas em{' '}
            <strong style={{ color: COR_NEG }}>
              {fmtBRLCompacto(Math.abs(saldo), ocultar)}
            </strong>
            .
          </>
        ),
      });
    }
  }

  // ─── 11) Próximas a vencer (próximos 7 dias) ───
  if (proximas.length > 0) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const em7 = proximas.filter((t) => {
      const [y, m, d] = t.data.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      const dias = Math.ceil((dt - hoje) / (1000 * 60 * 60 * 24));
      return dias <= 7;
    });
    if (em7.length > 0) {
      const totalEm7 = em7.reduce((s, t) => s + t.valor, 0);
      out.push({
        icon: 'bell',
        cor: COR_AVISO,
        texto: (
          <>
            <strong style={{ color: 'var(--ink)' }}>
              {em7.length} {em7.length === 1 ? 'conta vence' : 'contas vencem'}
            </strong>{' '}
            nos próximos 7 dias —{' '}
            {fmtBRLCompacto(totalEm7, ocultar)} no total.
          </>
        ),
      });
    }
  }

  // ─── 12) Categoria estourando o orçamento ───
  if (orcCategorias.length > 0) {
    const estourada = orcCategorias.find((c) => c.pct > 100);
    if (estourada) {
      out.push({
        icon: 'bell',
        cor: COR_NEG,
        texto: (
          <>
            <strong style={{ color: 'var(--ink)' }}>{estourada.cat.nome}</strong>{' '}
            passou do orçamento em{' '}
            <strong style={{ color: COR_NEG }}>
              {Math.round(estourada.pct - 100)}%
            </strong>
            .
          </>
        ),
      });
    } else {
      const proxLimite = orcCategorias.find((c) => c.pct >= 80);
      if (proxLimite) {
        out.push({
          icon: 'target',
          cor: COR_AVISO,
          texto: (
            <>
              <strong style={{ color: 'var(--ink)' }}>{proxLimite.cat.nome}</strong>{' '}
              já consumiu{' '}
              <strong style={{ color: COR_AVISO }}>
                {Math.round(proxLimite.pct)}%
              </strong>{' '}
              do orçamento da categoria.
            </>
          ),
        });
      }
    }
  }

  // ─── 13) Volume de transações ───
  {
    const qtdGastos = txMes.filter((t) => t.tipo !== 'entrada').length;
    const qtdAnt = txMesAnt.filter((t) => t.tipo !== 'entrada').length;
    if (qtdGastos >= 5 && qtdAnt > 0) {
      const ticket = total / qtdGastos;
      out.push({
        icon: 'list',
        cor: 'var(--primary)',
        texto: (
          <>
            {qtdGastos} transações no mês — ticket médio de{' '}
            <strong style={{ color: 'var(--ink)' }}>
              {fmtBRLCompacto(ticket, ocultar)}
            </strong>
            .
          </>
        ),
      });
    }
  }

  // Fallback: se nada bateu (mês vazio), uma dica de boas-vindas.
  if (out.length === 0 && total === 0 && entradas === 0) {
    out.push({
      icon: 'sparkle',
      cor: 'var(--primary)',
      texto: (
        <>
          Comece adicionando seus gastos do mês — os insights aparecem quando
          houver dados suficientes pra analisar.
        </>
      ),
    });
  }

  return out;
}
