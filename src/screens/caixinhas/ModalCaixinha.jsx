// ModalCaixinha.jsx — criar / editar caixinha (nome, cor, meta e investimento).

import React from "react";
import { Icon } from "../../ui/icons.jsx";
import { formatarValorDigitado, formatarValorInicial, parseValorBR } from "../../lib/money-input.js";
import { useSelic, taxaAnualEfetiva } from "../../lib/selic.js";
import { CORES_CAIXINHA } from "./utils.js";
import { hojeISO } from "../../lib/datas.js";
import { ModalShell, Campo, Toggle, inputStyle } from "../../ui/modal-shell.jsx";
import { Expansivel } from "../../ui/expansivel.jsx";
import { simboloMoeda } from "../../lib/moeda.js";
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

  // ─── Avançado / investimento ───
  const [avancadoAberto, setAvancadoAberto] = React.useState(!!editando?.rendimentoAtivo);
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
      <Campo label={t("Nome")}>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder={t("Ex: Viagem para a praia")}
          style={inputStyle}
        />
      </Campo>

      <Campo label={t("Cor")}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {CORES_CAIXINHA.map((c) => {
            const sel = cor === c;
            return (
              <button
                key={c}
                className="opcao-suave"
                onClick={() => setCor(c)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  background: c,
                  border: sel ? "3px solid var(--ink)" : "3px solid transparent",
                  cursor: "pointer",
                  padding: 0,
                }}
              />
            );
          })}
        </div>
      </Campo>

      <Campo label={t("Meta (opcional)")}>
        {/* A margem de baixo do cabeçalho virou margem de cima do conteúdo:
            dentro do bloco ela some junto na hora de fechar. */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Toggle ativo={temMeta} onChange={setTemMeta} />
          <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>
            {temMeta ? t("Definir um valor-alvo") : t("Sem meta — só vou juntando")}
          </span>
        </div>
        <Expansivel aberto={temMeta}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
              <span style={{ fontSize: 14, color: "var(--muted)", fontWeight: 700 }}>{simboloMoeda()}</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={meta}
                onChange={(e) => setMeta(formatarValorDigitado(e.target.value))}
                style={inputStyle}
              />
            </div>
            <div style={{ marginTop: 10 }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "var(--card-2)",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                }}
              >
                <Icon name="calendar" size={16} color="var(--muted)" strokeWidth={2} />
                <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>
                  {t("Até quando?")} <span style={{ opacity: 0.7 }}>{t("(opcional)")}</span>
                </span>
                <input
                  type="date"
                  value={dataMeta}
                  min={hojeISO()}
                  onChange={(e) => setDataMeta(e.target.value)}
                  style={{
                    border: "none",
                    background: "transparent",
                    outline: "none",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--ink)",
                    fontFamily: "inherit",
                  }}
                />
              </label>
            </div>
          </div>
        </Expansivel>
      </Campo>

      {/* ─── Saldo inicial (só ao criar) ─── */}
      {!editando && (
        <Campo label={t("Já tinha dinheiro guardado?")}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Toggle ativo={temSaldoInicial} onChange={setTemSaldoInicial} />
            <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>
              {temSaldoInicial ? t("Informar o valor que já havia") : t("Começar do zero")}
            </span>
          </div>
          <Expansivel aberto={temSaldoInicial}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
                <span style={{ fontSize: 14, color: "var(--muted)", fontWeight: 700 }}>{simboloMoeda()}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={saldoInicial}
                  onChange={(e) => setSaldoInicial(formatarValorDigitado(e.target.value))}
                  style={inputStyle}
                />
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 11,
                  color: "var(--muted)",
                  fontWeight: 500,
                  lineHeight: 1.45,
                }}
              >
                {t("Esse valor já existia — entra na caixinha sem sair do seu saldo do mês.")}
              </div>
            </div>
          </Expansivel>
        </Campo>
      )}

      {/* ─── Avançado (investimento) ─── */}
      <div style={{ marginTop: 18 }}>
        <button
          onClick={() => setAvancadoAberto((v) => !v)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            padding: "12px 14px",
            borderRadius: 12,
            border: "none",
            background: "var(--card-2)",
            cursor: "pointer",
            fontFamily: "inherit",
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="chart" size={16} color="var(--muted)" strokeWidth={2.2} />
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)" }}>{t("Avançado")}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)" }}>{t("Investimento")}</span>
          </div>
          <span
            className="chevron-expansivel"
            style={{
              display: "inline-flex",
              transform: avancadoAberto ? "rotate(180deg)" : "none",
            }}
          >
            <Icon name="chevron-down" size={16} color="var(--muted)" strokeWidth={2} />
          </span>
        </button>

        <Expansivel aberto={avancadoAberto}>
          <div
            style={{
              marginTop: 10,
              padding: "12px 14px",
              borderRadius: 12,
              background: "var(--card-2)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Toggle ativo={rendimentoAtivo} onChange={setRendimentoAtivo} />
              <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>
                {rendimentoAtivo ? t("Render como investimento") : t("Sem rendimento — caixinha comum")}
              </span>
            </div>

            {/* Bloco dentro de bloco: o de fora acompanha a altura do de dentro
                enquanto os dois animam. */}
            <Expansivel aberto={rendimentoAtivo}>
              <div style={{ marginTop: 12 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                    marginBottom: 6,
                  }}
                >
                  {t("Taxa de rendimento (% do CDI)")}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={rendimentoCDI}
                    onChange={(e) => {
                      // aceita só dígitos, vírgula e ponto
                      const v = e.target.value.replace(/[^\d.,]/g, "");
                      setRendimentoCDI(v);
                    }}
                    placeholder="100"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <span style={{ fontSize: 14, color: "var(--muted)", fontWeight: 700 }}>{t("% CDI")}</span>
                </div>
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 12,
                    color: "var(--muted)",
                    fontWeight: 500,
                    lineHeight: 1.45,
                  }}
                >
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
                </div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 11,
                    color: "var(--muted)",
                    fontWeight: 500,
                    lineHeight: 1.45,
                    opacity: 0.85,
                  }}
                >
                  {t("100% CDI = renda igual ao CDI · Estimativa diária com base na Meta Selic do BCB. Não considera IR.")}
                </div>
              </div>
            </Expansivel>
          </div>
        </Expansivel>
      </div>
    </ModalShell>
  );
}
