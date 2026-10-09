// ModalResgate.jsx — resgatar valor da caixinha (volta como entrada do mês).

import React from "react";
import { fmtBRL } from "../../data.js";
import { COR_NEG } from "../../lib/colors.js";
import { formatarValorInicial, parseValorBR, valorZero } from "../../lib/money-input.js";
import { ModalShell } from "../../ui/modal-shell.jsx";
import { Aviso, Linha, ListaAgrupada, NotaLinha, ValorGrande, estiloValorLinha } from "../../ui/form-lista.jsx";
import { Expansivel, useUltimoNaoNulo } from "../../ui/expansivel.jsx";
import { useT } from "../../lib/i18n.jsx";

export function ModalResgate({ cor, nome, disponivel, rendimento = 0, onFechar, onSalvar }) {
  const t = useT();
  const [valor, setValor] = React.useState(valorZero());

  const valorNum = parseValorBR(valor);
  const excede = valorNum > disponivel + 0.001;
  const podeSalvar = valorNum > 0 && !excede;
  // O rendimento sai proporcional ao que for resgatado — a caixinha volta a
  // acumular do zero sobre o que sobrar.
  const rendimentoQueSai =
    rendimento > 0 && disponivel > 0 && valorNum > 0
      ? rendimento * Math.min(1, valorNum / disponivel)
      : 0;

  const rendimentoVisivel = useUltimoNaoNulo(
    rendimentoQueSai > 0.005 ? rendimentoQueSai : null,
  ) || 0;

  const aplicarTudo = () => setValor(formatarValorInicial(disponivel));

  const salvar = () => {
    if (!podeSalvar) return;
    onSalvar(valorNum);
  };

  return (
    <ModalShell titulo={t("Resgatar de \"{nome}\"", { nome })} onFechar={onFechar} onSalvar={salvar} salvarAtivo={podeSalvar} corAcento={cor}>
      <ValorGrande valor={valor} onChange={setValor} ariaLabel={t("Valor a resgatar")} />

      <ListaAgrupada style={{ marginTop: 16 }}>
        <Linha icone="piggy" rotulo={t("Disponível na caixinha")}>
          <span style={{ ...estiloValorLinha, fontVariantNumeric: "tabular-nums" }}>{fmtBRL(disponivel)}</span>
          <button
            className="opcao-suave"
            onClick={aplicarTudo}
            disabled={disponivel <= 0}
            style={{
              padding: "6px 12px",
              borderRadius: "var(--raio-pilula)",
              border: "none",
              background: cor,
              color: "#fff",
              fontSize: 12,
              fontWeight: 800,
              cursor: disponivel > 0 ? "pointer" : "default",
              opacity: disponivel > 0 ? 1 : 0.5,
              fontFamily: "inherit",
              flexShrink: 0,
            }}
          >
            {t("Tudo")}
          </button>
        </Linha>
        <NotaLinha>
          {t("O valor volta como uma ")}<strong style={{ color: "var(--ink)" }}>{t("entrada do mês atual")}</strong>{t(" e fica disponível no orçamento.")}
          {/* O valor congela no último não-zero enquanto a linha fecha, senão o
              texto viraria "R$ 0,00" no meio da animação. */}
          <Expansivel aberto={rendimentoQueSai > 0.005}>
            <div style={{ marginTop: 4 }}>
              {t("O rendimento de {x} sai junto e deixa de render.", {
                x: fmtBRL(rendimentoVisivel),
              })}
            </div>
          </Expansivel>
        </NotaLinha>
      </ListaAgrupada>

      <Expansivel aberto={excede}>
        <Aviso icone="close" cor={COR_NEG}>{t("Valor maior que o disponível na caixinha.")}</Aviso>
      </Expansivel>
    </ModalShell>
  );
}
