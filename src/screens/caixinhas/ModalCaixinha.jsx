// ModalCaixinha.jsx — criar / editar caixinha (nome, cor, meta e investimento).

import React from "react";
import { formatarValorInicial, parseValorBR } from "../../lib/money-input.js";
import { useSelic, taxaAnualEfetiva } from "../../lib/selic.js";
import { CORES_CAIXINHA } from "./utils.js";
import { hojeISO } from "../../lib/datas.js";
import { ModalShell } from "../../ui/modal-shell.jsx";
import {
  InputMoedaLinha,
  Linha,
  ListaAgrupada,
  NotaLinha,
  SeletorCores,
  estiloInputLinha,
  estiloValorLinha,
} from "../../ui/form-lista.jsx";
import { Toggle } from "../../ui/common.jsx";
import { Expansivel } from "../../ui/expansivel.jsx";
import { useT } from "../../lib/i18n.jsx";

export function ModalCaixinha({ editando, onFechar, onSalvar }) {
  const t = useT();
  const selic = useSelic();
  const [nome, setNome] = React.useState(editando?.nome ?? "");
  const [cor, setCor] = React.useState(editando?.cor ?? CORES_CAIXINHA[0]);
  const [temMeta, setTemMeta] = React.useState(editando ? !!editando.meta : false);
  const [meta, setMeta] = React.useState(formatarValorInicial(editando?.meta || 0));
  const [dataMeta, setDataMeta] = React.useState(editando?.dataMeta ?? "");

  // ─── Saldo inicial (só ao criar) ───
  // Dinheiro que já existia na caixinha antes de cadastrá-la aqui. Vira um
  // depósito do tipo "inicial", que soma ao valor atual mas NÃO abate o saldo
  // do mês (esse dinheiro não está saindo do orçamento agora).
  const [temSaldoInicial, setTemSaldoInicial] = React.useState(false);
  const [saldoInicial, setSaldoInicial] = React.useState(formatarValorInicial(0));
  const saldoInicialNum = parseValorBR(saldoInicial);

  // ─── Investimento ───
  const [rendimentoAtivo, setRendimentoAtivo] = React.useState(!!editando?.rendimentoAtivo);
  const [rendimentoCDI, setRendimentoCDI] = React.useState(String(editando?.rendimentoCDI ?? 100));
  const cdiNum = parseFloat(String(rendimentoCDI).replace(",", ".")) || 0;
  const taxaEfetiva = taxaAnualEfetiva(cdiNum, selic);

  const metaNum = parseValorBR(meta);
  const valido = nome.trim().length > 0;

  const salvar = () => {
    if (!valido) return;
    onSalvar({
      nome: nome.trim(),
      cor,
      meta: temMeta && metaNum > 0 ? metaNum : 0,
      dataMeta: temMeta && metaNum > 0 && dataMeta ? dataMeta : "",
      rendimentoAtivo: rendimentoAtivo && cdiNum > 0,
      rendimentoCDI: rendimentoAtivo && cdiNum > 0 ? cdiNum : 0,
      // Só faz sentido ao criar: caixinha nova pode já ter um valor prévio.
      saldoInicial: !editando && temSaldoInicial && saldoInicialNum > 0 ? saldoInicialNum : 0,
    });
  };

  return (
    <ModalShell
      titulo={editando ? t("Editar caixinha") : t("Nova caixinha")}
      onFechar={onFechar}
      onSalvar={salvar}
      salvarAtivo={valido}
    >
      {/* Nome e cor. A bolinha antes do nome já mostra a cor escolhida. */}
      <ListaAgrupada>
        <Linha
          as="label"
          inicio={
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: "var(--raio-pilula)",
                background: cor,
                flexShrink: 0,
                transition: "background .2s",
              }}
            />
          }
        >
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder={t("Ex: Viagem para a praia")}
            aria-label={t("Nome")}
            style={estiloInputLinha}
          />
        </Linha>
        <Linha divisoria style={{ padding: "10px 14px" }}>
          <SeletorCores cores={CORES_CAIXINHA} valor={cor} onChange={setCor} />
        </Linha>
      </ListaAgrupada>

      {/* Meta */}
      <ListaAgrupada>
        <Linha
          icone="target"
          rotulo={t("Meta (opcional)")}
          legenda={temMeta ? t("Definir um valor-alvo") : t("Sem meta — só vou juntando")}
          as="label"
        >
          <Toggle ativo={temMeta} onChange={setTemMeta} />
        </Linha>
        <Expansivel aberto={temMeta}>
          <Linha icone="piggy" rotulo={t("Valor-alvo")} divisoria as="label">
            <InputMoedaLinha valor={meta} onChange={setMeta} ariaLabel={t("Valor-alvo")} />
          </Linha>
          <Linha icone="calendar" rotulo={t("Até quando?")} legenda={t("(opcional)")} divisoria as="label">
            <input
              type="date"
              value={dataMeta}
              min={hojeISO()}
              onChange={(e) => setDataMeta(e.target.value)}
              style={estiloValorLinha}
            />
          </Linha>
        </Expansivel>
      </ListaAgrupada>

      {/* Saldo inicial (só ao criar) */}
      {!editando && (
        <ListaAgrupada>
          <Linha
            icone="wallet"
            rotulo={t("Já tinha dinheiro guardado?")}
            legenda={temSaldoInicial ? t("Informar o valor que já havia") : t("Começar do zero")}
            as="label"
          >
            <Toggle ativo={temSaldoInicial} onChange={setTemSaldoInicial} />
          </Linha>
          <Expansivel aberto={temSaldoInicial}>
            <Linha icone="plus" rotulo={t("Valor")} divisoria as="label">
              <InputMoedaLinha valor={saldoInicial} onChange={setSaldoInicial} ariaLabel={t("Valor")} />
            </Linha>
            <NotaLinha>
              {t("Esse valor já existia — entra na caixinha sem sair do seu saldo do mês.")}
            </NotaLinha>
          </Expansivel>
        </ListaAgrupada>
      )}

      {/* Investimento. A chave já esconde a parte técnica — dispensa o
          "Avançado" que embrulhava este bloco. */}
      <ListaAgrupada>
        <Linha
          icone="chart"
          rotulo={t("Render como investimento")}
          legenda={rendimentoAtivo ? null : t("Sem rendimento — caixinha comum")}
          as="label"
        >
          <Toggle ativo={rendimentoAtivo} onChange={setRendimentoAtivo} />
        </Linha>
        <Expansivel aberto={rendimentoAtivo}>
          <Linha icone="sparkle" rotulo={t("Taxa de rendimento (% do CDI)")} divisoria as="label">
            <input
              type="text"
              inputMode="decimal"
              value={rendimentoCDI}
              onChange={(e) => {
                // aceita só dígitos, vírgula e ponto
                setRendimentoCDI(e.target.value.replace(/[^\d.,]/g, ""));
              }}
              placeholder="100"
              style={{ ...estiloValorLinha, width: 52, textAlign: "right", fontSize: 16, fontWeight: 800 }}
            />
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>%</span>
          </Linha>
          <NotaLinha>
            {t("Selic atual: ")}
            <strong style={{ color: "var(--ink)" }}>
              {selic.toFixed(2).replace(".", ",")}% {t("a.a.")}
            </strong>
            {cdiNum > 0 && (
              <>
                {t(" · rende ~")}
                <strong style={{ color: "var(--ink)" }}>
                  {taxaEfetiva.toFixed(2).replace(".", ",")}% {t("a.a.")}
                </strong>
              </>
            )}
            <div style={{ marginTop: 4, fontWeight: 500, opacity: 0.85 }}>
              {t("100% CDI = renda igual ao CDI · Estimativa diária com base na Meta Selic do BCB. Não considera IR.")}
            </div>
          </NotaLinha>
        </Expansivel>
      </ListaAgrupada>
    </ModalShell>
  );
}
