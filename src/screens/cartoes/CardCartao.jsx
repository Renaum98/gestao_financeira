// CardCartao.jsx — uma linha da lista de cartões.
//
// Mostra a miniatura do cartão, quanto está comprometido da fatura e o quanto
// disso já comeu o limite. Os valores são leitura pura (lib/fatura.js): nenhum
// deles entra na conta do saldo do mês.

import { fmtBRL } from "../../data.js";
import { Icon } from "../../ui/icons.jsx";
import { BarraProgresso } from "../../ui/charts.jsx";
import { COR_NEG, COR_AVISO, COR_POS } from "../../lib/colors.js";
import { corDoCartao, corTextoSobre, faixaDoUso } from "../../lib/cartoes.js";
import { useT } from "../../lib/i18n.jsx";

// Cor da faixa de uso do limite. Sem limite informado não há faixa.
export function corDaFaixa(pct) {
  const faixa = faixaDoUso(pct);
  if (faixa === "estourado") return COR_NEG;
  if (faixa === "aperto") return COR_AVISO;
  if (faixa === "meio") return "var(--primary)";
  return COR_POS;
}

// Miniatura na cor do cartão. É um desenho genérico — a tarja e o par de
// círculos —, nunca a marca de ninguém: o app não guarda número nem bandeira,
// e não se propõe a imitar o cartão físico.
//
// Os detalhes por cima seguem a luminância da cor: num cartão amarelo o branco
// sumiria, então eles viram escuros.
export function MiniCartao({ cor }) {
  const claro = corTextoSobre(cor) === "#FFFFFF";
  const tinta = (a) => (claro ? `rgba(255,255,255,${a})` : `rgba(20,16,24,${a})`);
  return (
    <div
      aria-hidden
      style={{
        width: 62,
        height: 42,
        borderRadius: 9,
        flexShrink: 0,
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(135deg, ${cor}, color-mix(in oklab, ${cor} 72%, #000))`,
        boxShadow: "0 2px 6px rgba(20,16,24,0.18)",
      }}
    >
      {/* tarja/chip */}
      <div
        style={{
          position: "absolute",
          top: 9,
          left: 8,
          width: 12,
          height: 9,
          borderRadius: 2.5,
          background: tinta(0.5),
        }}
      />
      {/* par de círculos, no canto de cima */}
      <div style={{ position: "absolute", top: 8, right: 8, display: "flex" }}>
        <div style={{ width: 11, height: 11, borderRadius: 6, background: tinta(0.55) }} />
        <div
          style={{ width: 11, height: 11, borderRadius: 6, marginLeft: -4, background: tinta(0.3) }}
        />
      </div>
      {/* linhas do relevo */}
      <div
        style={{
          position: "absolute",
          bottom: 8,
          left: 8,
          width: 30,
          height: 4,
          borderRadius: 2,
          background: tinta(0.35),
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 8,
          left: 42,
          width: 12,
          height: 4,
          borderRadius: 2,
          background: tinta(0.2),
        }}
      />
    </div>
  );
}

export function CardCartao({ cartao, uso, onClick, primeiro }) {
  const t = useT();
  const dia = cartao.diaFechamento || 0;
  const cor = corDaFaixa(uso.pct);

  return (
    <div
      onClick={onClick}
      className="clicavel"
      style={{
        padding: primeiro ? "14px 0 16px" : "16px 0",
        borderTop: primeiro ? "none" : "1px solid var(--linha)",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          fontSize: 15,
          fontWeight: 800,
          color: "var(--ink)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {cartao.nome}
      </div>
      {/* O app não guarda número nem bandeira, então o que situa o cartão aqui
          é o ciclo — não os últimos dígitos. */}
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", marginTop: 2 }}>
        {dia > 0 ? t("Fecha dia {dia}", { dia }) : t("Fecha no último dia do mês")}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
        <MiniCartao cor={corDoCartao(cartao)} />

        <div style={{ flex: 1, minWidth: 0, textAlign: "right" }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "var(--ink)",
              letterSpacing: "-0.02em",
            }}
          >
            {fmtBRL(uso.usado)}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginTop: 2 }}>
            {uso.temLimite
              ? t("{disponivel} livres de {limite}", {
                  disponivel: fmtBRL(uso.disponivel),
                  limite: fmtBRL(uso.limite),
                })
              : t("Sem limite informado")}
          </div>
        </div>

        <Icon name="chevron-right" size={18} color="var(--muted)" strokeWidth={2} />
      </div>

      {uso.temLimite && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
          <div style={{ flex: 1 }}>
            <BarraProgresso valor={uso.usado} max={uso.limite} cor={cor} altura={8} />
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, color: cor, minWidth: 40, textAlign: "right" }}>
            {uso.pct.toFixed(0)}%
          </div>
        </div>
      )}
    </div>
  );
}
