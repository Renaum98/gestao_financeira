// simular-gasto.jsx — modal de simulação de gasto.
// O usuário informa valor + parcelas e recebe uma análise textual de
// como esse gasto cabe (ou não) no orçamento do mês atual e nos meses
// seguintes, no caso de parcelamento.
//
// "Começando em" adia a compra pra um mês à frente: a análise passa a pesar
// contra o saldo PREVISTO daquele mês (orçamento − o que já está lançado lá,
// como parcelas e recorrências), e o período do parcelamento conta dali.

import React from "react";
import { fmtBRL, MESES_CURTO } from "../data.js";
import { Icon } from "../ui/icons.jsx";
import { ModalOverlay } from "../ui/modal-base.jsx";
import { vibrar } from "../lib/haptics.js";
import { COR_POS, COR_NEG, COR_AVISO } from "../lib/colors.js";
import { parseValorBR, valorZero } from "../lib/money-input.js";
import { mesShift } from "../lib/datas.js";
import { useT } from "../lib/i18n.jsx";
import { Aviso, Linha, ListaAgrupada, ValorGrande, estiloValorLinha } from "../ui/form-lista.jsx";

// Até onde dá pra adiar o início: um ano pra frente.
const INICIO_MAX = 12;

export function SimularGastoModal({
  restante = 0,
  orcTotal = 0,
  mes,
  saldoDoMes,
  fechar,
}) {
  const t = useT();
  const [valor, setValor] = React.useState(valorZero());
  const [parcelas, setParcelas] = React.useState(1);
  // Meses à frente de `mes` em que a compra começa. 0 = o próprio mês.
  const [inicio, setInicio] = React.useState(0);
  const ehAgora = inicio === 0;
  const mesInicio = mes ? mesShift(mes, inicio) : mes;
  const rotuloInicio = React.useMemo(() => {
    if (!mesInicio) return "";
    const [y, m] = mesInicio.split("-").map(Number);
    return `${t(MESES_CURTO[m - 1])}/${String(y).slice(2)}`;
  }, [mesInicio, t]);

  // No próprio mês valem os números que o card mostra; à frente, o saldo
  // previsto daquele mês.
  const saldoInicio = React.useMemo(
    () => (ehAgora || !saldoDoMes ? { restante, orcTotal } : saldoDoMes(mesInicio)),
    [ehAgora, saldoDoMes, mesInicio, restante, orcTotal],
  );
  const restanteIni = saldoInicio.restante;
  const orcTotalIni = saldoInicio.orcTotal;

  const valorNum = parseValorBR(valor);
  const n = Math.max(1, Math.min(48, parcelas));
  const valorParcela = valorNum / n;

  const blocos = React.useMemo(() => {
    if (valorNum <= 0 || !mesInicio) return [];
    const [y, m] = mesInicio.split("-").map(Number);
    const restante = restanteIni;
    const orcTotal = orcTotalIni;
    const mesTxt = rotuloInicio;
    const out = [];

    if (n === 1) {
      // Pagamento à vista — compara só com o restante do mês atual.
      if (restante <= 0) {
        out.push({
          tom: COR_NEG,
          texto: (
            <>
              {ehAgora
                ? t("Seu orçamento deste mês já está ")
                : t("Seu orçamento de {mes} já está ", { mes: mesTxt })}
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
              {ehAgora ? t(" até o fim do mês.") : t(" em {mes}.", { mes: mesTxt })}
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
              {ehAgora
                ? t(" Você só tem {restante} disponíveis no mês — o restante teria que sair de outra fonte.", { restante: fmtBRL(restante) })
                : t(" Você só tem {restante} previstos para {mes} — o restante teria que sair de outra fonte.", { restante: fmtBRL(restante), mes: mesTxt })}
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

      // Impacto da 1ª parcela no mês de início.
      if (restante <= 0) {
        out.push({
          tom: COR_NEG,
          texto: (
            <>
              {ehAgora
                ? t("Este mês já está com orçamento ")
                : t("{mes} já está com orçamento ", { mes: mesTxt })}
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
              <strong>{ehAgora ? t("cabe neste mês") : t("cabe em {mes}", { mes: mesTxt })}</strong>
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
              <strong>
                {ehAgora ? t("estoura o restante deste mês") : t("estoura o previsto para {mes}", { mes: mesTxt })}
              </strong>
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
  }, [valorNum, n, restanteIni, orcTotalIni, mesInicio, rotuloInicio, ehAgora, valorParcela, t]);

  const passoInicio = (delta) => {
    vibrar(8);
    setInicio((i) => Math.max(0, Math.min(INICIO_MAX, i + delta)));
  };
  const passoParcelas = (delta) => {
    vibrar(8);
    setParcelas((p) => Math.max(1, Math.min(48, p + delta)));
  };
  // Botão redondo dos passos (− / + e ‹ / ›), do tamanho da linha.
  const botaoPasso = (desligado) => ({
    width: 30,
    height: 30,
    borderRadius: "var(--raio-pilula)",
    border: "none",
    background: "var(--card)",
    color: "var(--ink)",
    cursor: desligado ? "default" : "pointer",
    opacity: desligado ? 0.4 : 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "inherit",
    flexShrink: 0,
    padding: 0,
  });
  const valorPasso = {
    minWidth: 58,
    textAlign: "center",
    fontSize: 13,
    fontWeight: 800,
    color: "var(--primary)",
    fontVariantNumeric: "tabular-nums",
  };

  return (
    <ModalOverlay onClose={fechar} maxWidth={420} padding="14px 18px 20px">
        {/* Cabeçalho: é uma ferramenta, não um formulário — não há o que
            salvar, só fechar. */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "var(--raio-pilula)",
                background: "color-mix(in oklab, var(--primary) 14%, transparent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon name="coin" size={16} color="var(--primary)" strokeWidth={2.2} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.01em" }}>
              {t("Cabe no orçamento?")}
            </div>
          </div>
          <button
            onClick={fechar}
            aria-label={t("Fechar")}
            style={{
              width: 30,
              height: 30,
              borderRadius: "var(--raio-pilula)",
              background: "var(--card-2)",
              border: "none",
              color: "var(--muted)",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500, marginTop: 4 }}>
          {t("Simule um gasto e veja como ele afeta seu mês.")}
        </div>

        <ValorGrande valor={valor} onChange={setValor} ariaLabel={t("Valor da compra")} />

        <ListaAgrupada style={{ marginTop: 14 }}>
          {/* Parcelas: os passos acertam o número; a régua embaixo dá o salto
              grande de uma vez. */}
          <Linha
            icone="card"
            rotulo={t("Parcelas")}
            legenda={n === 1 ? t("à vista") : t("{n}× de {vp}", { n, vp: fmtBRL(valorParcela) })}
          >
            <button onClick={() => passoParcelas(-1)} disabled={n <= 1} aria-label={t("Diminuir parcelas")} style={botaoPasso(n <= 1)}>
              <Icon name="minus" size={15} />
            </button>
            <div style={{ ...valorPasso, minWidth: 30, color: "var(--ink)" }}>{n}×</div>
            <button onClick={() => passoParcelas(1)} disabled={n >= 48} aria-label={t("Aumentar parcelas")} style={botaoPasso(n >= 48)}>
              <Icon name="plus" size={15} />
            </button>
          </Linha>
          <div style={{ padding: "0 14px 10px 42px" }}>
            <input
              type="range"
              min={1}
              max={24}
              step={1}
              value={Math.min(n, 24)}
              onChange={(e) => setParcelas(parseInt(e.target.value, 10))}
              style={{ width: "100%", accentColor: "var(--primary)", margin: 0 }}
              aria-label={t("Quantidade de parcelas")}
            />
          </div>

          <Linha icone="calendar" rotulo={t("Começando em")} divisoria>
            <button onClick={() => passoInicio(-1)} disabled={ehAgora} aria-label={t("Mês anterior")} style={botaoPasso(ehAgora)}>
              <Icon name="arrow-left" size={14} />
            </button>
            <div aria-live="polite" style={valorPasso}>
              {ehAgora ? t("este mês") : rotuloInicio}
            </div>
            <button onClick={() => passoInicio(1)} disabled={inicio >= INICIO_MAX} aria-label={t("Próximo mês")} style={botaoPasso(inicio >= INICIO_MAX)}>
              <Icon name="arrow-right" size={14} />
            </button>
          </Linha>

          {/* Contexto: orçamento do mês de início */}
          {orcTotalIni > 0 && (
            <Linha
              icone="wallet"
              rotulo={ehAgora ? t("Restante deste mês") : t("Previsto para {mes}", { mes: rotuloInicio })}
              divisoria
            >
              <span
                style={{
                  ...estiloValorLinha,
                  color: restanteIni >= 0 ? COR_POS : COR_NEG,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {fmtBRL(restanteIni)}
              </span>
            </Linha>
          )}
        </ListaAgrupada>

        {/* Análise textual */}
        <div style={{ marginTop: 12 }}>
          {valorNum <= 0 ? (
            <Aviso icone="sparkle">{t("Digite um valor para ver a análise.")}</Aviso>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {blocos.map((b, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: "var(--raio-controle)",
                    background: `color-mix(in oklab, ${b.tom} 10%, transparent)`,
                  }}
                >
                  <div
                    style={{
                      width: 4,
                      borderRadius: "var(--raio-pilula)",
                      background: b.tom,
                      flexShrink: 0,
                    }}
                  />
                  <div
                    style={{
                      fontSize: 12.5,
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
    </ModalOverlay>
  );
}
