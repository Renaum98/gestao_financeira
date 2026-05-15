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

export function SimularGastoModal({
  restante = 0,
  orcTotal = 0,
  mes,
  ocultar = false,
  fechar,
}) {
  const [valor, setValor] = React.useState("0,00");
  const [parcelas, setParcelas] = React.useState(1);

  // Mesmo estilo "calculadora" do add-expense — cada dígito vira centavo.
  const aoDigitar = (texto) => {
    let v = texto.replace(/\D/g, "");
    if (v.length > 10) v = v.slice(0, 10);
    if (!v) {
      setValor("0,00");
      return;
    }
    v = v.padStart(3, "0");
    const reais = v.slice(0, -2);
    const cent = v.slice(-2);
    setValor(`${parseInt(reais, 10)},${cent}`);
  };

  const valorNum = parseFloat(valor.replace(",", ".")) || 0;
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
              Seu orçamento deste mês já está <strong>negativo em {fmtBRL(Math.abs(restante))}</strong>.
              Esse gasto aumentaria o déficit em <strong>{fmtBRL(valorNum)}</strong>.
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
              <strong>Cabe no orçamento.</strong> Compromete {pct}% do mês e ainda
              sobrariam <strong>{fmtBRL(sobra)}</strong> até o fim do mês.
            </>
          ),
        });
      } else {
        const estouro = valorNum - restante;
        out.push({
          tom: COR_NEG,
          texto: (
            <>
              <strong>Estoura o orçamento em {fmtBRL(estouro)}.</strong> Você
              só tem {fmtBRL(restante)} disponíveis no mês — o restante teria
              que sair de outra fonte.
            </>
          ),
        });
      }
    } else {
      // Parcelado — mostra horizonte + impacto mensal.
      const fim = new Date(y, m - 1 + n - 1, 1);
      const periodoIni = `${MESES_CURTO[m - 1]}/${String(y).slice(2)}`;
      const periodoFim = `${MESES_CURTO[fim.getMonth()]}/${String(fim.getFullYear()).slice(2)}`;

      out.push({
        tom: "var(--primary)",
        texto: (
          <>
            <strong>{n}× de {fmtBRL(valorParcela)}</strong> — de {periodoIni} até {periodoFim}.
            Total final: {fmtBRL(valorNum)}.
          </>
        ),
      });

      // Impacto da 1ª parcela no mês atual.
      if (restante <= 0) {
        out.push({
          tom: COR_NEG,
          texto: (
            <>
              Este mês já está com orçamento <strong>negativo</strong> — a 1ª
              parcela aumentaria o déficit em <strong>{fmtBRL(valorParcela)}</strong>.
            </>
          ),
        });
      } else if (valorParcela <= restante) {
        const sobra = restante - valorParcela;
        out.push({
          tom: COR_POS,
          texto: (
            <>
              A 1ª parcela <strong>cabe neste mês</strong> — restarão {fmtBRL(sobra)} depois dela.
            </>
          ),
        });
      } else {
        const estouro = valorParcela - restante;
        out.push({
          tom: COR_NEG,
          texto: (
            <>
              A parcela de {fmtBRL(valorParcela)} já <strong>estoura o restante deste mês</strong> em {fmtBRL(estouro)}.
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
                Cada parcela toma <strong>{Math.round(pctMensal)}% do seu orçamento mensal</strong> —
                comprometimento alto por <strong>{n} meses</strong>.
              </>
            ),
          });
        } else if (pctMensal >= 15) {
          out.push({
            tom: COR_AVISO,
            texto: (
              <>
                Cada parcela representa <strong>{Math.round(pctMensal)}%</strong> do seu orçamento mensal
                — comprometimento médio por {n} meses.
              </>
            ),
          });
        } else {
          out.push({
            tom: COR_POS,
            texto: (
              <>
                Cada parcela representa apenas <strong>{Math.round(pctMensal)}%</strong> do seu orçamento
                mensal — impacto leve durante {n} meses.
              </>
            ),
          });
        }
      }
    }

    return out;
  }, [valorNum, n, restante, orcTotal, mes, valorParcela]);

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
              Cabe no orçamento?
            </div>
          </div>
          <button
            onClick={fechar}
            aria-label="Fechar"
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
          Simule um gasto e veja como ele afeta seu mês.
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
            Valor da compra
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
              R$
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
            aria-label="Valor da compra"
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
              Parcelas
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: "var(--primary)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {n === 1 ? "à vista" : `${n}× de ${fmtBRL(valorParcela)}`}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => {
                vibrar(8);
                setParcelas((p) => Math.max(1, p - 1));
              }}
              aria-label="Diminuir parcelas"
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
              aria-label="Quantidade de parcelas"
            />
            <button
              onClick={() => {
                vibrar(8);
                setParcelas((p) => Math.min(48, p + 1));
              }}
              aria-label="Aumentar parcelas"
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
              Digite um valor para ver a análise.
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
            <span>Restante deste mês</span>
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
