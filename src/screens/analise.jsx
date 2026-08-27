// analise.jsx — Tela Análise (pizza, resumo, evolução, formas de pagamento,
// ranking). Orquestra os blocos; cada um vive em ./analise/*.

import React from "react";
import {
  CATEGORIAS,
  catsMinhas,
  totalEntradas,
  totalGeral,
  totalPorCategoria,
  txDoMes,
  rotuloMesCurto,
} from "../data.js";
import { Card, SeletorMes, TopBar } from "../ui/common.jsx";
import { useT } from "../lib/i18n.jsx";
import { obterOrcBaseDoMes } from "../lib/orcamento.js";
import { guardadoNoMes } from "../lib/saldo-mes.js";
import { chaveMes, mesShift, diasNoMes } from "../lib/datas.js";
import { ProjecaoAno } from "./analise/ProjecaoAno.jsx";
import { ResumoMes } from "./analise/ResumoMes.jsx";
import { PizzaCategorias } from "./analise/PizzaCategorias.jsx";
import { EvolucaoMeses } from "./analise/EvolucaoMeses.jsx";
import { EvolucaoConjunta } from "./analise/EvolucaoConjunta.jsx";
import { PorPagamento } from "./analise/PorPagamento.jsx";
import { TopCategorias } from "./analise/TopCategorias.jsx";
import { MaioresGastos } from "./analise/MaioresGastos.jsx";
import { AtalhoOrcamentos } from "./analise/AtalhoOrcamentos.jsx";

export function AnaliseScreen({ ctx }) {
  const {
    txs, mes, setMes, todosMeses, mesAnterior, irPara, ehDesktop,
    partnerTxs = [], partnerNome = "", partnerUid,
    preferences = {}, caixinhas = [], usuario,
    recorrentes = [],
  } = ctx;
  const tr = useT();
  const ehCompartilhado = !!partnerUid;
  const spanAll = ehDesktop ? "col-span-all" : undefined;

  const txMes = React.useMemo(() => txDoMes(txs, mes), [txs, mes]);
  const txMesAnt = React.useMemo(
    () => (mesAnterior ? txDoMes(txs, mesAnterior) : []),
    [txs, mesAnterior],
  );
  const porCat = totalPorCategoria(txMes);
  const porCatAnt = totalPorCategoria(txMesAnt);
  const total = totalGeral(txMes);
  const totalAnt = totalGeral(txMesAnt);

  const dados = catsMinhas()
    .filter((c) => (porCat[c] || 0) > 0)
    .map((c) => ({
      id: c,
      valor: porCat[c],
      cor: CATEGORIAS[c].cor,
      nome: CATEGORIAS[c].nome,
    }))
    .sort((a, b) => b.valor - a.valor);

  // ─── Resumo ───
  const hoje = new Date();
  const mesAtual = chaveMes(hoje);
  const diasDecorridos = mes === mesAtual ? hoje.getDate() : diasNoMes(mes);
  const mediaDia = diasDecorridos > 0 ? total / diasDecorridos : 0;
  const entradasMes = totalEntradas(txMes);

  // "Sobrou" no mês — mesma fórmula do card de saldo do Dashboard:
  //   restante = (orçamento base + entradas) − guardado em caixinhas − gastos
  // `obterOrcBaseDoMes` aplica o orçamento vigente ao mês atual, aos futuros e
  // ao imediatamente anterior; meses mais antigos leem o histórico de vigência
  // em preferences.orcBaseAt. Assim alterar o orçamento hoje reflete no mês
  // passado mais recente e dali pra frente, sem mexer em meses antigos.
  const orcBase = obterOrcBaseDoMes(mes, preferences, mesAtual);
  const meuUid = usuario?.uid;
  const guardadoEmCaixinhas = React.useMemo(
    () => guardadoNoMes(caixinhas, mes, meuUid, partnerUid).meu,
    [caixinhas, mes, meuUid, partnerUid],
  );
  const orcTotal = orcBase + entradasMes - guardadoEmCaixinhas;
  const restante = orcTotal - total;
  const pctRestante = orcTotal > 0 ? (restante / orcTotal) * 100 : null;

  const diffTotal = totalAnt > 0 ? ((total - totalAnt) / totalAnt) * 100 : null;

  // ─── Evolução (6 meses) ───
  const evolucao = React.useMemo(() => {
    const out = [];
    for (let i = 5; i >= 0; i--) {
      const k = mesShift(mes, -i);
      out.push({
        key: k,
        label: tr(rotuloMesCurto(k).replace(/ \d+$/, "")),
        total: totalGeral(txDoMes(txs, k)),
      });
    }
    return out;
    // `tr` entra aqui porque o rótulo do mês passa por ele. Parece dispensável
    // — funções costumam ser estáveis —, mas o `useT` devolve um useCallback
    // amarrado ao idioma (lib/i18n.jsx), então a identidade muda justamente
    // quando a tradução muda. Sem ele, trocar de idioma não mexe em `txs` nem
    // em `mes`, o memo não refaz e o gráfico fica com os meses na língua
    // anterior enquanto o resto da tela já virou.
  }, [txs, mes, tr]);
  const maxEvol = Math.max(...evolucao.map((e) => e.total), 1);
  const mediaEvol = evolucao.reduce((s, e) => s + e.total, 0) / evolucao.length;

  // Evolução conjunta (eu + parceiro), 6 meses, barras lado a lado por mês.
  const evolucaoConjunta = React.useMemo(() => {
    if (!ehCompartilhado) return null;
    const out = [];
    for (let i = 5; i >= 0; i--) {
      const k = mesShift(mes, -i);
      out.push({
        key: k,
        label: tr(rotuloMesCurto(k).replace(/ \d+$/, "")),
        meu: totalGeral(txDoMes(txs, k)),
        parceiro: totalGeral(txDoMes(partnerTxs, k)),
      });
    }
    return out;
  }, [ehCompartilhado, txs, partnerTxs, mes, tr]); // `tr`: ver o memo acima
  const maxEvolConjunta = evolucaoConjunta
    ? Math.max(...evolucaoConjunta.flatMap((e) => [e.meu, e.parceiro]), 1)
    : 1;

  // ─── Por forma de pagamento (só saídas) ───
  const porPagamento = React.useMemo(() => {
    const m = {};
    for (const t of txMes) {
      if (t.tipo === "entrada") continue;
      const k = t.pagamento || "Outros";
      m[k] = (m[k] || 0) + t.valor;
    }
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [txMes]);

  // ─── Maiores gastos (só saídas) ───
  const maioresGastos = React.useMemo(
    () => txMes.filter((t) => t.tipo !== "entrada").sort((a, b) => b.valor - a.valor).slice(0, 5),
    [txMes],
  );

  const vazio = total === 0 && (!ehCompartilhado || totalGeral(txDoMes(partnerTxs, mes)) === 0);

  return (
    <div className={ehDesktop ? "cols-desktop" : undefined} style={{ paddingBottom: "var(--pad-bottom)" }}>
      <div className={spanAll}>
        <TopBar titulo={tr("Análise")} />
      </div>
      {/* Projeção do ano — fica acima do seletor de propósito: é a foto do ano
          inteiro e não muda quando o usuário troca o mês da análise. */}
      <ProjecaoAno
        txs={txs}
        recorrentes={recorrentes}
        preferences={preferences}
        mesAtual={mesAtual}
        spanAll={spanAll}
      />

      <div
        className={spanAll}
        style={{ padding: "0 var(--pad-x) 12px", display: "flex", justifyContent: "flex-end" }}
      >
        <SeletorMes mes={mes} setMes={setMes} todosMeses={todosMeses} />
      </div>

      {vazio ? (
        <div className={spanAll} style={{ padding: "0 var(--pad-x)" }}>
          <Card style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: 14, color: "var(--muted)", fontWeight: 600 }}>
              {tr("Nenhum gasto registrado neste mês.")}
            </div>
          </Card>
        </div>
      ) : (
        <>
          <ResumoMes
            total={total}
            diffTotal={diffTotal}
            mediaDia={mediaDia}
            diasDecorridos={diasDecorridos}
            txCount={txMes.length}
            catCount={dados.length}
            restante={restante}
            orcTotal={orcTotal}
            pctRestante={pctRestante}
            spanAll={spanAll}
          />

          <PizzaCategorias dados={dados} total={total} comTitulo={ehDesktop} />

          <EvolucaoMeses
            evolucao={evolucao}
            maxEvol={maxEvol}
            mediaEvol={mediaEvol}
            mes={mes}
            setMes={setMes}
          />

          <EvolucaoConjunta
            evolucaoConjunta={evolucaoConjunta}
            maxEvolConjunta={maxEvolConjunta}
            mes={mes}
            setMes={setMes}
            partnerNome={partnerNome}
          />

          <PorPagamento porPagamento={porPagamento} total={total} />

          <TopCategorias dados={dados} porCatAnt={porCatAnt} irPara={irPara} />

          <MaioresGastos maioresGastos={maioresGastos} />
        </>
      )}

      <AtalhoOrcamentos irPara={irPara} spanAll={spanAll} />
    </div>
  );
}
