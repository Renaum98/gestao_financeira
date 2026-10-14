// EvolucaoConjunta.jsx — barras lado a lado (você x parceiro) nos últimos 6
// meses, com a diferença em valor entre os dois em cima de cada par. Só
// renderiza em conta compartilhada.

import { MESES, fmtBRL, fmtBRLCompacto } from "../../data.js";
import { Card } from "../../ui/common.jsx";
import { SecaoTitulo } from "./SecaoTitulo.jsx";
import { useT } from "../../lib/i18n.jsx";

export function EvolucaoConjunta({ evolucaoConjunta, maxEvolConjunta, mes, setMes, partnerNome }) {
  const t = useT();
  if (!evolucaoConjunta) return null;
  const nome = partnerNome || t("Parceiro");

  // Frase do rodapé, sobre o mês selecionado: quem gastou mais e quanto.
  const sel = evolucaoConjunta.find((e) => e.key === mes);
  let frase = null;
  if (sel && (sel.meu > 0 || sel.parceiro > 0)) {
    const nomeMes = t(MESES[Number(sel.key.slice(5, 7)) - 1]);
    const dif = Math.abs(sel.meu - sel.parceiro);
    frase =
      dif < 0.005
        ? t("Em {mes}, vocês gastaram o mesmo.", { mes: nomeMes })
        : sel.meu > sel.parceiro
          ? t("Em {mes}, você gastou {x} a mais que {nome}.", { mes: nomeMes, x: fmtBRL(dif), nome })
          : t("Em {mes}, {nome} gastou {x} a mais que você.", { mes: nomeMes, x: fmtBRL(dif), nome });
  }

  return (
    <div style={{ padding: "var(--esp-secao) var(--pad-x) 0" }}>
      <SecaoTitulo>{t("Você vs. {nome}", { nome: partnerNome || t("parceiro") })}</SecaoTitulo>
      <Card className="card-cheio">
        <div
          className="grafico-barras"
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 8,
            height: 164,
          }}
        >
          {evolucaoConjunta.map((e) => {
            const hMeu = Math.max((e.meu / maxEvolConjunta) * 100, e.meu > 0 ? 4 : 0);
            const hParc = Math.max((e.parceiro / maxEvolConjunta) * 100, e.parceiro > 0 ? 4 : 0);
            const atual = e.key === mes;
            // A diferença leva a cor da barra de quem gastou mais — é assim que
            // se lê de quem é sem precisar de sinal nem de nome.
            const dif = e.meu - e.parceiro;
            return (
              <div
                key={e.key}
                onClick={() => setMes(e.key)}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  cursor: "pointer",
                  height: "100%",
                  justifyContent: "flex-end",
                }}
              >
                <div
                  title={
                    dif === 0
                      ? undefined
                      : dif > 0
                        ? t("Você gastou {x} a mais", { x: fmtBRL(dif) })
                        : t("{nome} gastou {x} a mais", { nome, x: fmtBRL(-dif) })
                  }
                  style={{
                    height: 12,
                    lineHeight: "12px",
                    fontSize: 9,
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                    color: dif > 0 ? "var(--primary)" : "var(--muted)",
                  }}
                >
                  {Math.abs(dif) >= 0.005 && (e.meu > 0 || e.parceiro > 0)
                    ? `+${fmtBRLCompacto(Math.abs(dif))}`
                    : ""}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 3,
                    height: "100%",
                    width: "100%",
                    justifyContent: "center",
                  }}
                >
                  <div
                    title={t("Você: {x}", { x: fmtBRL(e.meu) })}
                    style={{
                      flex: 1,
                      maxWidth: 16,
                      height: `${hMeu}%`,
                      borderRadius: "var(--raio-miudo)",
                      background: "linear-gradient(180deg, var(--primary), var(--primary-2))",
                      transition: "height .2s",
                      minHeight: e.meu > 0 ? 4 : 0,
                    }}
                  />
                  <div
                    title={t("{nome}: {x}", { nome, x: fmtBRL(e.parceiro) })}
                    style={{
                      flex: 1,
                      maxWidth: 16,
                      height: `${hParc}%`,
                      borderRadius: "var(--raio-miudo)",
                      background: "var(--surface-sunken)",
                      border: "1px solid var(--linha)",
                      transition: "height .2s",
                      minHeight: e.parceiro > 0 ? 4 : 0,
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: atual ? "var(--primary)" : "var(--muted)",
                  }}
                >
                  {e.label}
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid var(--linha)",
            display: "flex",
            justifyContent: "center",
            gap: 18,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "var(--raio-minimo)",
                background: "linear-gradient(180deg, var(--primary), var(--primary-2))",
              }}
            />
            <span style={{ color: "var(--ink)" }}>{t("Você")}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "var(--raio-minimo)",
                background: "var(--surface-sunken)",
                border: "1px solid var(--linha)",
              }}
            />
            <span style={{ color: "var(--muted)" }}>{nome}</span>
          </div>
        </div>
        {frase && (
          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              fontWeight: 600,
              color: "var(--muted)",
              textAlign: "center",
            }}
          >
            {frase}
          </div>
        )}
      </Card>
    </div>
  );
}
