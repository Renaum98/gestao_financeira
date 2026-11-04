// OrcamentoDoMes.jsx — orçamento do mês escolhido na Análise, editável.
//
// Mudar aqui grava um ajuste só daquele mês (preferences.orcDoMes, ver
// lib/orcamento.js): os outros meses e o orçamento mensal não mudam. Fica fora
// do bloco "sem gastos" da Análise de propósito — um mês sem lançamentos
// também pode precisar de orçamento.

import React from "react";
import { MESES, fmtBRL } from "../../data.js";
import { Card } from "../../ui/common.jsx";
import { Icon } from "../../ui/icons.jsx";
import {
  formatarValorDigitado,
  formatarValorInicial,
  parseValorBR,
  valorZero,
} from "../../lib/money-input.js";
import { simboloMoeda } from "../../lib/moeda.js";
import { ajusteDoMes, comAjusteDoMes, obterOrcBaseDoMes } from "../../lib/orcamento.js";
import { useT } from "../../lib/i18n.jsx";

export function OrcamentoDoMes({ mes, mesAtual, preferences, setPreferences, spanAll }) {
  const t = useT();
  const [editando, setEditando] = React.useState(false);
  const [temp, setTemp] = React.useState(valorZero());

  // Trocou de mês com o campo aberto: fecha, senão o valor digitado iria pro mês novo.
  React.useEffect(() => setEditando(false), [mes]);

  const orcBase = obterOrcBaseDoMes(mes, preferences, mesAtual);
  const ajustado = ajusteDoMes(mes, preferences) !== null;
  const nomeMes = t(MESES[Number(mes.slice(5, 7)) - 1]);

  const salvar = () => {
    const novo = Math.max(0, parseValorBR(temp));
    setPreferences({ orcDoMes: comAjusteDoMes(preferences, mes, novo) });
    setEditando(false);
  };

  const voltarAoMensal = () => {
    setPreferences({ orcDoMes: comAjusteDoMes(preferences, mes, null) });
    setEditando(false);
  };

  return (
    <div className={spanAll} style={{ padding: "0 var(--pad-x) var(--esp-pilha)" }}>
      <Card style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>
              {t("Orçamento de {mes}", { mes: nomeMes })}
            </div>
            {!editando && (
              <div style={{ marginTop: 2, fontSize: 18, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>
                {fmtBRL(orcBase)}
              </div>
            )}
          </div>
          {!editando && (
            <button
              onClick={() => { setTemp(formatarValorInicial(orcBase)); setEditando(true); }}
              aria-label={t("Editar")}
              style={{
                background: "transparent", border: "none", cursor: "pointer", padding: 4, color: "var(--muted)",
              }}
            >
              <Icon name="edit" size={16} strokeWidth={2} />
            </button>
          )}
        </div>

        {editando && (
          <>
            <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: "var(--muted)" }}>{simboloMoeda()}</span>
              <input
                autoFocus
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={temp}
                onChange={(e) => setTemp(formatarValorDigitado(e.target.value))}
                onKeyDown={(e) => { if (e.key === "Enter") salvar(); if (e.key === "Escape") setEditando(false); }}
                style={{
                  flex: 1, padding: "6px 10px", borderRadius: "var(--raio-compacto)",
                  border: "none", background: "var(--surface-sunken)",
                  fontSize: 20, fontWeight: 800, color: "var(--ink)",
                  outline: "none", fontFamily: "inherit", letterSpacing: "-0.02em", minWidth: 0,
                }}
              />
              <button onClick={salvar} aria-label={t("Salvar")} style={{
                width: 32, height: 32, borderRadius: "var(--raio-pilula)", border: "none", cursor: "pointer",
                background: "var(--primary)", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Icon name="check" size={15} color="#fff" strokeWidth={2.6} />
              </button>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, fontWeight: 600, lineHeight: 1.4, color: "var(--muted)" }}>
              {t("Muda só {mes}. Os outros meses e o orçamento mensal continuam como estão.", { mes: nomeMes })}
            </div>
          </>
        )}

        {!editando && (
          <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, fontWeight: 600, color: "var(--muted)" }}>
            <span>{ajustado ? t("Ajustado só para este mês") : t("Segue o orçamento mensal")}</span>
            {ajustado && (
              <button onClick={voltarAoMensal} style={{
                background: "transparent", border: "none", cursor: "pointer", padding: 0,
                fontSize: 11.5, fontWeight: 700, color: "var(--primary)", fontFamily: "inherit",
              }}>
                {t("Voltar ao mensal")}
              </button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
