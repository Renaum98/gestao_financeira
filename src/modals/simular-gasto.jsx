// simular-gasto.jsx — modal de simulação de gasto.
// O usuário informa valor + parcelas e recebe uma análise textual de
// como esse gasto cabe (ou não) no orçamento do mês atual e nos meses
// seguintes, no caso de parcelamento.

import React from "react";
import { fmtBRL, MESES_CURTO } from "../data.js";
import { Icon } from "../ui/icons.jsx";
import { ModalOverlay } from "../ui/modal-base.jsx";
import { vibrar } from "../lib/haptics.js";
import { COR_POS, COR_NEG, COR_AVISO } from "../lib/colors.js";
import { formatarValorDigitado, parseValorBR, valorZero } from "../lib/money-input.js";
import { simboloMoeda } from "../lib/moeda.js";
import { useT } from "../lib/i18n.jsx";

export function SimularGastoModal({
  restante = 0,
  orcTotal = 0,
  mes,
  ocultar = false,
  fechar,
}) {
  const t = useT();
  const [valor, setValor] = React.useState(valorZero());
  const [parcelas, setParcelas] = React.useState(1);

  const aoDigitar = (texto) => setValor(formatarValorDigitado(texto));
  const valorNum = parseValorBR(valor);
  const n = Math.max(1, Math.min(48, parcelas));
  const valorParcela = valorNum / n;

  const blocos = React.useMemo(() => {
    if (valorNum <= 0 || !mes) return [];
    const [y, m] = mes.split("-").map(Number);
    const out = [];

    if (n === 1) {
      // Pagamento à vista — compara só com o restante do mês atual.
      if (restante <= 0) {
        out.push({
          tom: COR_NEG,
          texto: (
            <>
              {t("Seu orçamento deste mês já está ")}
              <strong>{t("negativo em {x}", { x: fmtBRL(Math.abs(restante)) })}</strong>
              {t(". Esse gasto aumentaria o déficit em ")}
              <strong>{fmtBRL(valorNum)}</strong>.
            </>
          ),
        });
      } else if (valorNum <= restante) {
        const sobra = restante - valorNum;
        const pct = orcTotal > 0 ? Math.round((valorNum / orcTotal) * 100) : 0;
        out.push({
          tom: COR_POS,
          texto: (
            <>
              <strong>{t("Cabe no orçamento.")}</strong>
              {t(" Compromete {pct}% do mês e ainda sobrariam ", { pct })}
              <strong>{fmtBRL(sobra)}</strong>
              {t(" até o fim do mês.")}
            </>
          ),
        });
      } else {
        const estouro = valorNum - restante;
        out.push({
          tom: COR_NEG,
          texto: (
            <>
              <strong>{t("Estoura o orçamento em {x}.", { x: fmtBRL(estouro) })}</strong>
              {t(" Você só tem {restante} disponíveis no mês — o restante teria que sair de outra fonte.", { restante: fmtBRL(restante) })}
            </>
          ),
        });
      }
    } else {
      // Parcelado — mostra horizonte + impacto mensal.
      const fim = new Date(y, m - 1 + n - 1, 1);
      const periodoIni = `${t(MESES_CURTO[m - 1])}/${String(y).slice(2)}`;
      const periodoFim = `${t(MESES_CURTO[fim.getMonth()])}/${String(fim.getFullYear()).slice(2)}`;

      out.push({
        tom: "var(--primary)",
        texto: (
          <>
            <strong>{t("{n}× de {vp}", { n, vp: fmtBRL(valorParcela) })}</strong>
            {t(" — de {ini} até {fim}. Total final: {total}.", { ini: periodoIni, fim: periodoFim, total: fmtBRL(valorNum) })}
          </>
        ),
      });

      // Impacto da 1ª parcela no mês atual.
      if (restante <= 0) {
        out.push({
          tom: COR_NEG,
          texto: (
            <>
              {t("Este mês já está com orçamento ")}
              <strong>{t("negativo")}</strong>
              {t(" — a 1ª parcela aumentaria o déficit em ")}
              <strong>{fmtBRL(valorParcela)}</strong>.
            </>
          ),
        });
      } else if (valorParcela <= restante) {
        const sobra = restante - valorParcela;
        out.push({
          tom: COR_POS,
          texto: (
            <>
              {t("A 1ª parcela ")}
              <strong>{t("cabe neste mês")}</strong>
              {t(" — restarão {sobra} depois dela.", { sobra: fmtBRL(sobra) })}
            </>
          ),
        });
      } else {
        const estouro = valorParcela - restante;
        out.push({
          tom: COR_NEG,
          texto: (
            <>
              {t("A parcela de {vp} já ", { vp: fmtBRL(valorParcela) })}
              <strong>{t("estoura o restante deste mês")}</strong>
              {t(" em {estouro}.", { estouro: fmtBRL(estouro) })}
            </>
          ),
        });
      }

      // Comprometimento mensal — % do orçamento por mês durante N meses.
      if (orcTotal > 0) {
        const pctMensal = (valorParcela / orcTotal) * 100;
        if (pctMensal >= 30) {
          out.push({
            tom: COR_NEG,
            texto: (
              <>
                {t("Cada parcela toma ")}
                <strong>{t("{pct}% do seu orçamento mensal", { pct: Math.round(pctMensal) })}</strong>
                {t(" — comprometimento alto por ")}
                <strong>{t("{n} meses", { n })}</strong>.
              </>
            ),
          });
        } else if (pctMensal >= 15) {
          out.push({
            tom: COR_AVISO,
            texto: (
              <>
                {t("Cada parcela representa ")}
                <strong>{Math.round(pctMensal)}%</strong>
                {t(" do seu orçamento mensal — comprometimento médio por {n} meses.", { n })}
              </>
            ),
          });
        } else {
          out.push({
            tom: COR_POS,
            texto: (
              <>
                {t("Cada parcela representa apenas ")}
                <strong>{Math.round(pctMensal)}%</strong>
                {t(" do seu orçamento mensal — impacto leve durante {n} meses.", { n })}
              </>
            ),
          });
        }
      }
    }

    return out;
  }, [valorNum, n, restante, orcTotal, mes, valorParcela, t]);

  return (
    <ModalOverlay onClose={fechar} maxWidth={420}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                background:
                  "color-mix(in oklab, var(--primary) 14%, transparent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="target" size={15} color="var(--primary)" strokeWidth={2.4} />
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: "var(--ink)",
                letterSpacing: "-0.01em",
              }}
            >
              {t("Cabe no orçamento?")}
            </div>
          </div>
          <button
            onClick={fechar}
            aria-label={t("Fechar")}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--muted)",
              cursor: "pointer",
              padding: 4,
              display: "flex",
            }}
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div
          style={{
            fontSize: 12,
            color: "var(--muted)",
            fontWeight: 500,
            marginBottom: 6,
          }}
        >
          {t("Simule um gasto e veja como ele afeta seu mês.")}
        </div>

        {/* Valor — input "calculadora" */}
        <label
          style={{
            display: "block",
            textAlign: "center",
            padding: "10px 0 4px",
            cursor: "text",
            position: "relative",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: 0.6,
            }}
          >
            {t("Valor da compra")}
          </div>
          <div
            style={{
              fontSize: 42,
              fontWeight: 800,
              color: "var(--ink)",
              letterSpacing: "-0.04em",
              marginTop: 4,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <span
              style={{
                fontSize: 22,
                color: "var(--muted)",
                marginRight: 6,
                verticalAlign: "top",
              }}
            >
              {simboloMoeda()}
            </span>
            {valor}
          </div>
          <input
            autoFocus
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={valor.replace(",", "")}
            onChange={(e) => aoDigitar(e.target.value)}
            aria-label={t("Valor da compra")}
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0,
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: 16,
              cursor: "text",
            }}
          />
        </label>

        {/* Parcelas */}
        <div style={{ marginTop: 14 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--ink)",
              }}
            >
              {t("Parcelas")}
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: "var(--primary)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {n === 1 ? t("à vista") : t("{n}× de {vp}", { n, vp: fmtBRL(valorParcela) })}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => {
                vibrar(8);
                setParcelas((p) => Math.max(1, p - 1));
              }}
              aria-label={t("Diminuir parcelas")}
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                border: "none",
                background: "var(--card-2)",
                color: "var(--ink)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "inherit",
              }}
            >
              <Icon name="minus" size={18} />
            </button>
            <input
              type="range"
              min={1}
              max={24}
              step={1}
              value={n}
              onChange={(e) => setParcelas(parseInt(e.target.value, 10))}
              style={{ flex: 1, accentColor: "var(--primary)" }}
              aria-label={t("Quantidade de parcelas")}
            />
            <button
              onClick={() => {
                vibrar(8);
                setParcelas((p) => Math.min(48, p + 1));
              }}
              aria-label={t("Aumentar parcelas")}
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                border: "none",
                background: "var(--card-2)",
                color: "var(--ink)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "inherit",
              }}
            >
              <Icon name="plus" size={18} />
            </button>
          </div>
        </div>

        {/* Análise textual */}
        <div style={{ marginTop: 18 }}>
          {valorNum <= 0 ? (
            <div
              style={{
                padding: "16px 14px",
                borderRadius: 14,
                background: "var(--card-2)",
                color: "var(--muted)",
                fontSize: 13,
                fontWeight: 500,
                textAlign: "center",
                lineHeight: 1.45,
              }}
            >
              {t("Digite um valor para ver a análise.")}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {blocos.map((b, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 10,
                    padding: "12px 12px",
                    borderRadius: 14,
                    background: `color-mix(in oklab, ${b.tom} 10%, transparent)`,
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      borderRadius: 3,
                      background: b.tom,
                      flexShrink: 0,
                    }}
                  />
                  <div
                    style={{
                      fontSize: 13,
                      lineHeight: 1.5,
                      color: "var(--ink)",
                      fontWeight: 500,
                    }}
                  >
                    {b.texto}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contexto: orçamento atual */}
        {orcTotal > 0 && (
          <div
            style={{
              marginTop: 14,
              padding: "10px 12px",
              borderRadius: 12,
              background: "var(--card-2)",
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              color: "var(--muted)",
              fontWeight: 600,
            }}
          >
            <span>{t("Restante deste mês")}</span>
            <span
              style={{
                color: restante >= 0 ? COR_POS : COR_NEG,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {ocultar ? "•••" : fmtBRL(restante)}
            </span>
          </div>
        )}
    </ModalOverlay>
  );
}
