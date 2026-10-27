// FaturaCartao.jsx — ciclo da fatura do cartão no Dashboard.
//
// Mostra, por cartão cadastrado, só a fatura que ainda está aberta (acumulando
// compras) — o ciclo em que o usuário está gastando agora. A que já fechou
// saiu daqui de propósito. Sem cartão cadastrado é uma fatura só,
// somando todo o crédito — o comportamento de antes do cadastro.
//
// Cartão com limite informado ganha uma barra fina de uso embaixo da fatura,
// que só chama atenção (cor e texto) quando passa de 80% — no resto do tempo
// ela fica quieta.
//
// É uma camada de LEITURA: nada aqui entra na conta do saldo do mês, que
// continua por competência (a compra abate o mês em que foi feita). O rodapé do
// card existe justamente pra deixar isso explícito.

import { MESES, fmtBRL } from "../../data.js";
import { Icon } from "../../ui/icons.jsx";
import { Card } from "../../ui/common.jsx";
import { BarraProgresso } from "../../ui/charts.jsx";
import { corDoCartao, usoDoCartao, faixaDoUso } from "../../lib/cartoes.js";
import { MiniCartao, corDaFaixa } from "../cartoes/CardCartao.jsx";
import { useT } from "../../lib/i18n.jsx";

// "2026-08" → "Agosto" (já traduzido).
function nomeMes(mes, t) {
  return t(MESES[Number(mes.slice(5, 7)) - 1]);
}

// "2026-08-25" → "25/08"
function diaMes(data) {
  return `${data.slice(8, 10)}/${data.slice(5, 7)}`;
}

// Quando vence: a data exata se o cartão tem dia de vencimento, senão só o mês.
function venceEm(fatura, t) {
  return fatura.dataVence
    ? t("vence {data}", { data: diaMes(fatura.dataVence) })
    : t("vence em {mes}", { mes: nomeMes(fatura.vence, t) });
}

function LinhaFatura({ titulo, legenda, valor }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 0",
      }}
    >
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
            color: "var(--muted)",
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

// Uso do limite, discreto: barra de 3px e a porcentagem em cinza enquanto há
// folga; perto de estourar (≥80%) as duas pegam a cor da faixa, a mesma da
// tela Cartões.
function UsoLimite({ uso, t }) {
  const alerta = faixaDoUso(uso.pct) === "aperto" || faixaDoUso(uso.pct) === "estourado";
  const cor = corDaFaixa(uso.pct);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: -4, paddingBottom: 10 }}>
      <div style={{ flex: 1 }}>
        <BarraProgresso
          valor={uso.usado}
          max={uso.limite}
          cor={alerta ? cor : "color-mix(in oklab, var(--muted) 55%, transparent)"}
          altura={3}
        />
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: alerta ? 700 : 600,
          color: alerta ? cor : "var(--muted)",
          whiteSpace: "nowrap",
        }}
      >
        {uso.pct >= 100
          ? t("Passou do limite")
          : t("{pct}% do limite", { pct: uso.pct.toFixed(0) })}
      </div>
    </div>
  );
}

// Um grupo = um cartão (ou o grupo sem cartão). `cartao` null significa crédito
// sem cartão definido: ou o app inteiro antes do cadastro, ou as sobras de um
// cartão apagado com "deixar sem cartão".
function GrupoFatura({ grupo, varios, primeiro, t }) {
  const { cartao, faturas } = grupo;
  const { aberta } = faturas;
  const uso = cartao ? usoDoCartao(cartao, faturas) : null;
  // A cor do cartão puxada pro tom do tema: um amarelo puro num ícone de 18px
  // some no fundo claro, e o que importa aqui é reconhecer o cartão, não
  // reproduzir a cor exata.
  const cor = cartao
    ? `color-mix(in oklab, ${corDoCartao(cartao)} 65%, var(--ink))`
    : undefined;

  // Com vários cartões cada grupo ganha um cabeçalho com o nome do cartão, e a
  // linha diz só "Fatura atual" — quem lê sabe de quem é a fatura antes, sem
  // repetir o nome em cada linha.
  return (
    <div style={{ borderTop: primeiro ? "none" : "1px solid var(--linha)" }}>
      {varios && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 0 2px",
            fontSize: 12,
            fontWeight: 700,
            color: "var(--muted)",
            textTransform: "uppercase",
            letterSpacing: 0.4,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "var(--raio-pilula)",
              background: cor || "var(--muted)",
              flexShrink: 0,
            }}
          />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {cartao ? cartao.nome : t("Sem cartão")}
          </span>
        </div>
      )}
      {/* A miniatura do cartão ao lado da fatura dele. Sem cartão (crédito sem
          cartão definido) fica o ícone genérico. */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {cartao ? (
          <MiniCartao cor={corDoCartao(cartao)} />
        ) : (
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: "var(--raio-bloco)",
              background: "color-mix(in oklab, var(--muted) 14%, transparent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon name="card" size={18} color="var(--muted)" strokeWidth={2.2} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <LinhaFatura
            titulo={t("Fatura atual")}
            legenda={t("Aberta · fecha {data} · {vence}", {
              data: diaMes(aberta.fecha),
              vence: venceEm(aberta, t),
            })}
            valor={aberta.total}
          />
          {uso?.temLimite && <UsoLimite uso={uso} t={t} />}
        </div>
      </div>
    </div>
  );
}

export function FaturaCartao({ grupos, temCartoes, irPara, ehDesktop }) {
  const t = useT();
  if (!grupos || grupos.length === 0) return null;

  // Cartão sem nada na fatura atual só ocuparia espaço.
  const visiveis = grupos.filter((g) => g.faturas.aberta.total > 0);
  if (visiveis.length === 0) return null;

  return (
    <div className={ehDesktop ? "col-span-all" : undefined} style={{ padding: "var(--esp-secao) var(--pad-x) 0" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 4px var(--esp-titulo)",
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
