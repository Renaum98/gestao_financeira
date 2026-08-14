// FaturaCartao.jsx — ciclo da fatura do cartão no Dashboard.
//
// Mostra, por cartão cadastrado, a fatura que ainda está aberta (acumulando
// compras) e a que já fechou e vence agora. Sem cartão cadastrado é uma fatura
// só, somando todo o crédito — o comportamento de antes do cadastro.
//
// É uma camada de LEITURA: nada aqui entra na conta do saldo do mês, que
// continua por competência (a compra abate o mês em que foi feita). O rodapé do
// card existe justamente pra deixar isso explícito.

import { MESES, fmtBRL } from "../../data.js";
import { Icon } from "../../ui/icons.jsx";
import { Card } from "../../ui/common.jsx";
import { COR_AVISO } from "../../lib/colors.js";
import { corDoCartao } from "../../lib/cartoes.js";
import { useT } from "../../lib/i18n.jsx";

// "2026-08" → "Agosto" (já traduzido).
function nomeMes(mes, t) {
  return t(MESES[Number(mes.slice(5, 7)) - 1]);
}

// "2026-08-25" → "25/08"
function diaMes(dataISO) {
  return `${dataISO.slice(8, 10)}/${dataISO.slice(5, 7)}`;
}

function LinhaFatura({ titulo, legenda, valor, destaque, cor }) {
  const corIcone = destaque ? COR_AVISO : cor || "var(--muted)";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 0",
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: `color-mix(in oklab, ${corIcone} 14%, transparent)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon name="card" size={18} color={corIcone} strokeWidth={2.2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "var(--ink)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {titulo}
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: destaque ? COR_AVISO : "var(--muted)",
            marginTop: 2,
          }}
        >
          {legenda}
        </div>
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 800,
          color: "var(--ink)",
          letterSpacing: "-0.01em",
        }}
      >
        {fmtBRL(valor)}
      </div>
    </div>
  );
}

// Um grupo = um cartão (ou o grupo sem cartão). `cartao` null significa crédito
// sem cartão definido: ou o app inteiro antes do cadastro, ou as sobras de um
// cartão apagado com "deixar sem cartão".
function GrupoFatura({ grupo, varios, primeiro, t }) {
  const { cartao, faturas } = grupo;
  const { aberta, fechada } = faturas;
  // A cor do cartão puxada pro tom do tema: um amarelo puro num ícone de 18px
  // some no fundo claro, e o que importa aqui é reconhecer o cartão, não
  // reproduzir a cor exata.
  const cor = cartao
    ? `color-mix(in oklab, ${corDoCartao(cartao)} 65%, var(--ink))`
    : undefined;

  // Com vários cartões o nome vira o título — quem lê precisa saber de quem é a
  // fatura antes de saber de que mês ela é.
  const tituloDe = (mes) => {
    const nome = cartao ? cartao.nome : t("Sem cartão");
    if (!cartao && !varios) return t("Fatura de {mes}", { mes: nomeMes(mes, t) });
    return `${nome} · ${nomeMes(mes, t)}`;
  };

  return (
    <div style={{ borderTop: primeiro ? "none" : "1px solid var(--linha)" }}>
      {fechada && (
        <LinhaFatura
          destaque
          titulo={tituloDe(fechada.mes)}
          legenda={t("Fechada · vence em {mes}", { mes: nomeMes(fechada.vence, t) })}
          valor={fechada.total}
        />
      )}
      <div style={{ borderTop: fechada ? "1px solid var(--linha)" : "none" }}>
        <LinhaFatura
          cor={cor}
          titulo={tituloDe(aberta.mes)}
          legenda={t("Aberta · fecha {data} · vence em {mes}", {
            data: diaMes(aberta.fecha),
            mes: nomeMes(aberta.vence, t),
          })}
          valor={aberta.total}
        />
      </div>
    </div>
  );
}

export function FaturaCartao({ grupos, temCartoes, irPara, ehDesktop }) {
  const t = useT();
  if (!grupos || grupos.length === 0) return null;

  // Cartão sem movimento nos dois ciclos só ocuparia espaço.
  const visiveis = grupos.filter((g) => g.faturas.fechada || g.faturas.aberta.total > 0);
  if (visiveis.length === 0) return null;

  return (
    <div className={ehDesktop ? "col-span-all" : undefined} style={{ padding: "16px 20px 0" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 4px 6px",
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
          {visiveis.length > 1 ? t("Faturas dos cartões") : t("Fatura do cartão")}
        </div>
        <button
          onClick={() => irPara(temCartoes ? "cartoes" : "orcamentos")}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--primary)",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            padding: 0,
          }}
        >
          {t("Ajustar →")}
        </button>
      </div>
      <Card style={{ padding: "4px 16px 12px" }}>
        {visiveis.map((g, i) => (
          <GrupoFatura
            key={g.cartao?.id || "sem-cartao"}
            grupo={g}
            varios={visiveis.length > 1}
            primeiro={i === 0}
            t={t}
          />
        ))}
        <div
          style={{
            marginTop: 2,
            paddingTop: 10,
            borderTop: "1px solid var(--linha)",
            fontSize: 11,
            fontWeight: 600,
            color: "var(--muted)",
            lineHeight: 1.45,
          }}
        >
          {t("Não entra no saldo do mês: cada compra já abateu o mês em que foi feita.")}
        </div>
      </Card>
    </div>
  );
}
