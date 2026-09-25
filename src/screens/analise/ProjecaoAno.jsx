// ProjecaoAno.jsx — card de projeção do ANO INTEIRO no topo da Análise. De
// propósito NÃO depende do mês selecionado na tela: o seletor manda nos blocos
// abaixo, aqui a foto é sempre o ano corrente.
//
// Usa o <Card> comum, igual aos outros blocos da Análise — não o card de
// destaque colorido. Sobra e déficit usam o verde/vermelho da UI clara.
//
// A barra de gasto vem fatiada por categoria, cada fatia na cor dela, com a
// legenda logo abaixo.
//
// Abre recolhido: rótulo, ano e o valor da sobra. O detalhe (barra, entradas,
// gastos) vem no clique — mesmo padrão dos anos do Histórico.
//
// A conta do ano:
//   esperado = Σ (orçamento do mês + entradas do mês), janeiro a dezembro
//   sobra    = esperado − gastos do ano
// Ou seja: o orçamento de cada mês é dinheiro que se espera ter, não gasto
// previsto. Os gastos que descem dele são os reais — o que já foi lançado,
// incluindo parcelas com data futura.
//
// O orçamento é lido mês a mês, não "o de hoje × 12": `obterOrcBaseDoMes` usa o
// histórico de vigência, então um aumento feito em agosto vale de agosto (e do
// mês anterior, julho) em diante, e junho pra trás mantém o valor antigo.
//
// Entradas de um mês = as já lançadas + as agendadas (recorrentes do tipo
// entrada) que ainda não viraram tx naquele mês. O "ainda não viraram tx" evita
// contar duas vezes: o gerador de recorrentes lança as do mês atual pra trás, e
// cada tx gerada carrega `recorrenteId`.

import React from "react";
import {
  CATEGORIAS,
  fmtBRL,
  totalEntradas,
  totalPorCategoria,
  totalGeral,
  txDoMes,
  valorRecNoMes,
} from "../../data.js";
import { Card } from "../../ui/common.jsx";
import { Expansivel } from "../../ui/expansivel.jsx";
import { Icon } from "../../ui/icons.jsx";
import { calcOrcBaseAtual, obterOrcBaseDoMes } from "../../lib/orcamento.js";
import { COR_POS, COR_NEG } from "../../lib/colors.js";
import { vibrar } from "../../lib/haptics.js";
import { useT } from "../../lib/i18n.jsx";

function calcularProjecaoAno({ ano, txs, recorrentes, preferences, mesAtual }) {
  let orcamentoAno = 0;
  let entradasAno = 0;
  let gastosAno = 0;
  const porCat = {};
  // O orçamento pode mudar no meio do ano; guardamos o primeiro mês pra saber
  // se houve variação e ajustar a legenda do card.
  let orcPrimeiroMes = null;
  let orcVariou = false;

  for (let i = 1; i <= 12; i++) {
    const mes = `${ano}-${String(i).padStart(2, "0")}`;
    const txMes = txDoMes(txs, mes);

    const orcMes = obterOrcBaseDoMes(mes, preferences, mesAtual);
    if (orcPrimeiroMes === null) orcPrimeiroMes = orcMes;
    else if (orcMes !== orcPrimeiroMes) orcVariou = true;
    orcamentoAno += orcMes;
    gastosAno += totalGeral(txMes);
    for (const [c, v] of Object.entries(totalPorCategoria(txMes))) {
      porCat[c] = (porCat[c] || 0) + v;
    }

    // Entradas já lançadas no mês.
    entradasAno += totalEntradas(txMes);

    // Entradas agendadas que ainda não foram lançadas (meses à frente).
    if (mes < mesAtual) continue;
    const jaLancadas = new Set(
      txMes.filter((t) => t.recorrenteId).map((t) => t.recorrenteId),
    );
    for (const r of recorrentes) {
      if (r.tipo !== "entrada") continue;
      if (r.inicio && mes < r.inicio) continue;
      if (r.fim && mes > r.fim) continue;
      if (jaLancadas.has(r.id)) continue;
      entradasAno += valorRecNoMes(r, mes);
    }
  }

  const esperado = orcamentoAno + entradasAno;
  // Fatias da barra, da maior pra menor. Categoria que não existe mais cai na
  // cor de "Outros".
  const categorias = Object.entries(porCat)
    .filter(([, v]) => v > 0)
    .map(([id, valor]) => ({
      id,
      valor,
      nome: CATEGORIAS[id]?.nome || "Outros",
      cor: CATEGORIAS[id]?.cor || CATEGORIAS.outros.cor,
    }))
    .sort((a, b) => b.valor - a.valor);
  return {
    categorias,
    orcamentoAno,
    entradasAno,
    gastosAno,
    esperado,
    sobra: esperado - gastosAno,
    orcMensal: calcOrcBaseAtual(preferences),
    orcVariou,
  };
}

// Uma linha do detalhe. `destaque` marca o subtotal (Total esperado) com uma
// pastilha rebaixada — é o resultado da soma logo acima, não mais um item
// dela.
function Linha({ rotulo, valor, cor, destaque }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: destaque ? "10px 12px" : "9px 2px",
        margin: destaque ? "4px 0" : 0,
        borderRadius: destaque ? "var(--raio-controle)" : 0,
        background: destaque ? "var(--surface-sunken)" : undefined,
      }}
    >
      <span
        style={{
          fontSize: 12.5,
          fontWeight: destaque ? 700 : 600,
          color: destaque ? "var(--ink)" : "var(--muted)",
        }}
      >
        {rotulo}
      </span>
      <span
        style={{
          fontSize: 14,
          fontWeight: destaque ? 800 : 700,
          color: cor || "var(--ink)",
          letterSpacing: "-0.01em",
        }}
      >
        {valor}
      </span>
    </div>
  );
}

export function ProjecaoAno({ txs, recorrentes = [], preferences, mesAtual, spanAll }) {
  const t = useT();
  const ano = Number(mesAtual.slice(0, 4));
  const [aberto, setAberto] = React.useState(false);
  // Categorias da legenda mostrando o valor em moeda em vez do %. Cada toque
  // alterna só a categoria tocada.
  const [emValor, setEmValor] = React.useState(() => new Set());
  const alternarValor = (id) => {
    vibrar();
    setEmValor((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  };

  const { categorias, orcamentoAno, entradasAno, gastosAno, esperado, sobra, orcMensal, orcVariou } =
    React.useMemo(
      () => calcularProjecaoAno({ ano, txs, recorrentes, preferences, mesAtual }),
      [ano, txs, recorrentes, preferences, mesAtual],
    );

  // Barra: quanto do total esperado do ano os gastos já comeram.
  const pctGasto =
    esperado > 0 ? Math.min(100, (gastosAno / esperado) * 100) : gastosAno > 0 ? 100 : 0;
  const estourou = sobra < 0;

  const alternar = () => {
    vibrar();
    setAberto((v) => !v);
  };

  return (
    <div className={spanAll} style={{ padding: "4px var(--pad-x) 0" }}>
      <Card>
        {/* Só o cabeçalho e o valor comandam o abre-fecha; o detalhe fica fora
            do alvo, senão um clique perdido nele fecharia o card recém-aberto. */}
        <div
          onClick={alternar}
          role="button"
          tabIndex={0}
          aria-expanded={aberto}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              alternar();
            }
          }}
          style={{ cursor: "pointer" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>
              {t("Projeção anual")}
            </div>
            <span
              style={{
                padding: "4px 10px",
                borderRadius: "var(--raio-pilula)",
                background: "var(--surface-sunken)",
                color: "var(--ink)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 0.2,
              }}
            >
              {ano}
            </span>
            <span
              className="chevron-expansivel"
              style={{ display: "inline-flex", transform: aberto ? "rotate(180deg)" : "none" }}
            >
              <Icon name="chevron-down" size={18} color="var(--muted)" strokeWidth={2} />
            </span>
          </div>

          <div
            style={{
              marginTop: 10,
              fontSize: 34,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: estourou ? COR_NEG : COR_POS,
            }}
          >
            {estourou && "−"}
            {fmtBRL(Math.abs(sobra))}
          </div>
          <div style={{ marginTop: 2, fontSize: 11.5, fontWeight: 600, color: "var(--muted)" }}>
            {estourou ? t("acima do previsto no ano") : t("sobra prevista no ano")}
          </div>
        </div>

        <Expansivel aberto={aberto}>
          <div
            style={{
              marginTop: 16,
              paddingTop: 14,
              borderTop: "1px solid var(--linha)",
            }}
          >
            <div
              style={{
                height: 8,
                borderRadius: "var(--raio-pilula)",
                background: "var(--surface-sunken)",
                overflow: "hidden",
              }}
            >
              {/* O comprimento total ainda é o % do esperado; dentro dele cada
                  categoria ocupa a parte dela nos gastos do ano. */}
              <div
                className="projecao-barra"
                style={{
                  width: aberto ? `${pctGasto}%` : "0%",
                  height: "100%",
                  display: "flex",
                  gap: 2,
                  borderRadius: "var(--raio-pilula)",
                  overflow: "hidden",
                }}
              >
                {categorias.map((c) => (
                  <div
                    key={c.id}
                    title={`${t(c.nome)}: ${fmtBRL(c.valor)}`}
                    style={{ flex: `${c.valor} 0 0`, minWidth: 2, background: c.cor }}
                  />
                ))}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 8,
                fontSize: 12,
                fontWeight: 600,
                color: "var(--ink)",
              }}
            >
              <span>{t("Gasto: {x}", { x: fmtBRL(gastosAno) })}</span>
              <span style={{ color: estourou ? COR_NEG : "var(--muted)" }}>
                {t("{pct}% utilizado", { pct: pctGasto.toFixed(0) })}
              </span>
            </div>

            {categorias.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", marginTop: 10 }}>
                {categorias.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => alternarValor(c.id)}
                    aria-pressed={emValor.has(c.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: 0,
                      border: 0,
                      background: "none",
                      font: "inherit",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <span
                      style={{ width: 8, height: 8, borderRadius: "var(--raio-pilula)", background: c.cor }}
                    />
                    <span style={{ color: "var(--ink)" }}>{t(c.nome)}</span>
                    <span style={{ color: "var(--muted)" }}>
                      {emValor.has(c.id)
                        ? fmtBRL(c.valor)
                        : `${((c.valor / gastosAno) * 100).toFixed(0)}%`}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div style={{ marginTop: 10 }}>
              <Linha rotulo={t("Orçamento do ano")} valor={fmtBRL(orcamentoAno)} />
              <Linha rotulo={t("Entradas no ano")} valor={fmtBRL(entradasAno)} cor={COR_POS} />
              <Linha rotulo={t("Total esperado")} valor={fmtBRL(esperado)} destaque />
              <Linha rotulo={t("Gastos no ano")} valor={fmtBRL(gastosAno)} cor={COR_NEG} />
            </div>

            <div
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: "var(--muted)",
                lineHeight: 1.45,
                marginTop: 6,
              }}
            >
              {orcMensal <= 0
                ? t("sem orçamento definido — só as entradas contam")
                : orcVariou
                  ? t("orçamento de cada mês do ano + entradas agendadas")
                  : t("orçamento de {x}/mês nos 12 meses + entradas agendadas", {
                      x: fmtBRL(orcMensal),
                    })}
            </div>
          </div>
        </Expansivel>
      </Card>
    </div>
  );
}
