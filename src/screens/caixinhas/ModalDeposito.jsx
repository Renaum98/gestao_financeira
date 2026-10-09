// ModalDeposito.jsx — adicionar valor à caixinha. Origem pode ser o orçamento
// do mês ou o saldo disponível de uma entrada específica.

import React from "react";
import { fmtBRLCompacto } from "../../data.js";
import { Icon } from "../../ui/icons.jsx";
import { COR_POS, COR_NEG, COR_POS_FUNDO } from "../../lib/colors.js";
import { parseValorBR, valorZero } from "../../lib/money-input.js";
import { vibrar } from "../../lib/haptics.js";
import { hojeISO } from "../../lib/datas.js";
import { ModalShell } from "../../ui/modal-shell.jsx";
import {
  Aviso,
  Linha,
  LinhaOpcao,
  ListaAgrupada,
  NotaLinha,
  SeletorPilula,
  ValorGrande,
  estiloValorLinha,
} from "../../ui/form-lista.jsx";
import { Expansivel } from "../../ui/expansivel.jsx";
import { useT } from "../../lib/i18n.jsx";

export function ModalDeposito({ cor, gruposEntrada = [], alocadoPorDescricao = {}, onFechar, onSalvar }) {
  const t = useT();
  const [valor, setValor] = React.useState(valorZero());
  const [data, setData] = React.useState(hojeISO());
  const [origemTipo, setOrigemTipo] = React.useState("orcamento"); // 'orcamento' | 'entrada'
  const [entradaDesc, setEntradaDesc] = React.useState("");

  // Grupos com saldo (uma linha por descrição, somando todas as txs com o mesmo nome)
  const gruposComSaldo = React.useMemo(() => {
    return [...gruposEntrada]
      .map((g) => {
        const alocado = alocadoPorDescricao[g.descricao] || 0;
        return { ...g, alocado, disponivel: Math.max(0, g.total - alocado) };
      })
      .sort((a, b) => b.ultimaData.localeCompare(a.ultimaData));
  }, [gruposEntrada, alocadoPorDescricao]);

  const temEntradas = gruposComSaldo.length > 0;

  const valorNum = parseValorBR(valor);
  const grupoEscolhido = gruposComSaldo.find((g) => g.descricao === entradaDesc);
  const excedeEntrada =
    origemTipo === "entrada" && grupoEscolhido && valorNum > grupoEscolhido.disponivel + 0.001;
  const origemValida = origemTipo === "orcamento" || (grupoEscolhido && !excedeEntrada);
  const podeSalvar = valorNum > 0 && origemValida;

  const salvar = () => {
    if (!podeSalvar) return;
    const origem =
      origemTipo === "entrada"
        ? { tipo: "entrada", descricao: entradaDesc }
        : { tipo: "orcamento" };
    onSalvar({ id: `dp-${Date.now()}`, valor: valorNum, data, origem });
  };

  const escolherOrigem = (id) => {
    setOrigemTipo(id);
    if (id === "entrada" && !entradaDesc && temEntradas) {
      setEntradaDesc(gruposComSaldo[0].descricao);
    }
  };

  return (
    <ModalShell titulo={t("Adicionar valor")} onFechar={onFechar} onSalvar={salvar} salvarAtivo={podeSalvar} corAcento={cor}>
      <ValorGrande valor={valor} onChange={setValor} ariaLabel={t("Valor do depósito")} />

      {/* De onde sai o dinheiro — logo abaixo do valor, como o Saída/Entrada
          do gasto. Sem entrada lançada, só o orçamento vale. */}
      <SeletorPilula
        valor={origemTipo}
        onChange={escolherOrigem}
        opcoes={[
          { id: "orcamento", label: t("Orçamento") },
          { id: "entrada", label: t("Entrada"), disabled: !temEntradas },
        ]}
      />

      <ListaAgrupada>
        <Linha icone="calendar" rotulo={t("Quando")} as="label">
          <input
            type="date"
            value={data}
            max={hojeISO()}
            onChange={(e) => setData(e.target.value)}
            style={estiloValorLinha}
          />
        </Linha>
        <Expansivel aberto={origemTipo === "orcamento"}>
          <NotaLinha>{t("Será debitado do orçamento do mês.")}</NotaLinha>
        </Expansivel>
      </ListaAgrupada>

      {/* Qual entrada banca o depósito: uma linha por descrição, com o
          disponível de legenda. */}
      <Expansivel aberto={origemTipo === "entrada" && temEntradas}>
        <ListaAgrupada style={{ maxHeight: 240, overflowY: "auto" }}>
          {gruposComSaldo.map((g, i) => {
            const semSaldo = g.disponivel <= 0;
            return (
              <LinhaOpcao
                key={g.descricao}
                selecionado={entradaDesc === g.descricao}
                divisoria={i > 0}
                desabilitado={semSaldo}
                onClick={() => { if (semSaldo) return; vibrar(); setEntradaDesc(g.descricao); }}
                inicio={
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "var(--raio-pilula)",
                      background: COR_POS_FUNDO,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon name="plus" size={13} color={COR_POS} strokeWidth={2.6} />
                  </span>
                }
                rotulo={
                  <span style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {g.descricao}
                    {g.count > 1 && (
                      <span style={{ color: "var(--muted)", fontWeight: 600 }}>
                        {" "}· {t("{n} lançamentos", { n: g.count })}
                      </span>
                    )}
                  </span>
                }
                legenda={
                  t("disponível {x}", { x: fmtBRLCompacto(g.disponivel) }) +
                  (g.alocado > 0 ? t(" · alocado {x}", { x: fmtBRLCompacto(g.alocado) }) : "")
                }
              />
            );
          })}
        </ListaAgrupada>
      </Expansivel>

      <Expansivel aberto={origemTipo === "entrada" && !!excedeEntrada}>
        <Aviso icone="close" cor={COR_NEG}>{t("Valor excede o disponível desta entrada.")}</Aviso>
      </Expansivel>
    </ModalShell>
  );
}
