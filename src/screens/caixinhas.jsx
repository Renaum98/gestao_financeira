// caixinhas.jsx — Caixinhas (metas de poupança).
//
// Modelo:
//   caixinha = {
//     id, nome, cor,
//     meta?, dataMeta?,           // opcionais — se setados, exibe lembrança
//     criadoEm,
//     depositos: [{ id, valor, data }]
//   }
//
// Valor atual = soma dos depositos.

import React from "react";
import { fmtBRL, fmtBRLCompacto, MESES_CURTO } from "../data.js";
import { Icon } from "../ui/icons.jsx";
import { Card, TopBar } from "../ui/common.jsx";
import { BarraProgresso } from "../ui/charts.jsx";
import { ConfirmModal } from "../ui/confirm-modal.jsx";

const CORES_CAIXINHA = [
  "#6E4FF6",
  "#EF6B5C",
  "#1B9E6A",
  "#2566EA",
  "#E08A00",
  "#FF7AA8",
  "#3FCB9A",
  "#9B7BFF",
];

function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function valorAtual(cx) {
  return (cx.depositos || []).reduce((s, d) => s + d.valor, 0);
}

function diasEntre(de, ate) {
  const d1 = new Date(de + "T12:00:00");
  const d2 = new Date(ate + "T12:00:00");
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

function calcularLembranca(cx) {
  if (!cx.meta || cx.meta <= 0) return null;
  const atual = valorAtual(cx);
  const faltam = cx.meta - atual;
  if (faltam <= 0) return { completo: true, atual, faltam: 0 };
  if (!cx.dataMeta) return { semData: true, faltam };

  const dias = diasEntre(hojeISO(), cx.dataMeta);
  if (dias <= 0) return { vencido: true, faltam };

  const meses = dias / 30.44; // média
  if (meses >= 1) {
    return {
      tipo: "mensal",
      valor: faltam / meses,
      dias,
      dataMeta: cx.dataMeta,
      faltam,
    };
  }
  const semanas = dias / 7;
  if (semanas >= 1) {
    return {
      tipo: "semanal",
      valor: faltam / semanas,
      dias,
      dataMeta: cx.dataMeta,
      faltam,
    };
  }
  return {
    tipo: "diario",
    valor: faltam / dias,
    dias,
    dataMeta: cx.dataMeta,
    faltam,
  };
}

function rotuloDataCurto(yyyymmdd) {
  const d = new Date(yyyymmdd + "T12:00:00");
  return `${d.getDate()} ${MESES_CURTO[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}

// ─────────── Tela: lista de caixinhas ───────────
export function CaixinhasScreen({ ctx }) {
  const { caixinhas, salvarCaixinha, voltar, irPara, ocultar, ehDesktop } = ctx;
  const [modal, setModal] = React.useState(null); // null | 'nova' | { editando: caixinha }

  return (
    <div style={{ paddingBottom: "var(--pad-bottom)" }}>
      <TopBar voltar={ehDesktop ? undefined : voltar} titulo="Caixinhas" />

      <div style={{ padding: "4px 20px 0" }}>
        {caixinhas.length === 0 ? (
          <Card style={{ padding: 28, textAlign: "center" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                background:
                  "linear-gradient(135deg, var(--primary), var(--primary-2))",
                margin: "0 auto 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="piggy" size={26} color="#fff" strokeWidth={2.2} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>
              Sem caixinhas ainda
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--muted)",
                fontWeight: 500,
                marginTop: 6,
                lineHeight: 1.4,
              }}
            >
              Crie uma caixinha para juntar dinheiro com um objetivo (viagem,
              reserva, presente…). A meta é opcional.
            </div>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {caixinhas.map((cx) => (
              <CardCaixinha
                key={cx.id}
                cx={cx}
                ocultar={ocultar}
                onClick={() => irPara("caixinha", { id: cx.id })}
              />
            ))}
          </div>
        )}

        <button
          onClick={() => setModal("nova")}
          style={{
            width: "100%",
            marginTop: 16,
            padding: "14px",
            borderRadius: 16,
            border: "none",
            cursor: "pointer",
            background:
              "linear-gradient(135deg, var(--primary), var(--primary-2))",
            color: "#fff",
            fontSize: 14,
            fontWeight: 800,
            fontFamily: "inherit",
            boxShadow: "0 6px 16px color-mix(in oklab, var(--primary) 30%, transparent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Icon name="plus" size={18} color="#fff" strokeWidth={2.6} />
          Nova caixinha
        </button>
      </div>

      {modal && (
        <ModalCaixinha
          editando={modal === "nova" ? null : modal.editando}
          onFechar={() => setModal(null)}
          onSalvar={(dados) => {
            salvarCaixinha(dados);
            setModal(null);
          }}
        />
      )}
    </div>
  );
}

// ─────────── Tela: detalhe de uma caixinha ───────────
export function CaixinhaScreen({ ctx, params }) {
  const {
    caixinhas,
    txs,
    voltar,
    depositarCaixinha,
    excluirCaixinha,
    salvarCaixinha,
    ocultar,
  } = ctx;
  const entradas = React.useMemo(
    () => (txs || []).filter((t) => t.tipo === "entrada"),
    [txs],
  );
  // Agrupa entradas pela descrição (ex: várias txs "Shopee" viram uma única origem)
  const gruposEntrada = React.useMemo(() => {
    const m = {};
    for (const t of entradas) {
      const k = t.descricao;
      if (!m[k]) m[k] = { descricao: k, total: 0, ultimaData: t.data, count: 0 };
      m[k].total += t.valor;
      m[k].count += 1;
      if (t.data > m[k].ultimaData) m[k].ultimaData = t.data;
    }
    return Object.values(m);
  }, [entradas]);
  // Soma o que já foi alocado de cada grupo de entradas em todas as caixinhas.
  // Aceita depósitos antigos (origem.entradaId) resolvendo pela descrição da tx.
  const alocadoPorDescricao = React.useMemo(() => {
    const m = {};
    for (const c of caixinhas) {
      for (const dep of (c.depositos || [])) {
        if (dep.origem?.tipo !== "entrada") continue;
        let desc = dep.origem.descricao;
        if (!desc && dep.origem.entradaId) {
          const tx = entradas.find((e) => e.id === dep.origem.entradaId);
          desc = tx?.descricao;
        }
        if (desc) m[desc] = (m[desc] || 0) + dep.valor;
      }
    }
    return m;
  }, [caixinhas, entradas]);
  const cx = caixinhas.find((c) => c.id === params.id);
  const [modalDeposito, setModalDeposito] = React.useState(false);
  const [modalEditar, setModalEditar] = React.useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = React.useState(false);

  if (!cx) {
    return (
      <div>
        <TopBar voltar={voltar} titulo="Caixinha" />
        <div
          style={{ padding: 20, textAlign: "center", color: "var(--muted)" }}
        >
          Caixinha não encontrada.
        </div>
      </div>
    );
  }

  const atual = valorAtual(cx);
  const lembranca = calcularLembranca(cx);
  const pct = cx.meta > 0 ? Math.min(100, (atual / cx.meta) * 100) : 0;
  const depositos = [...(cx.depositos || [])].sort((a, b) =>
    b.data.localeCompare(a.data),
  );

  const onConfirmarExclusao = () => {
    excluirCaixinha(cx.id);
    setConfirmarExclusao(false);
    voltar();
  };

  return (
    <div style={{ paddingBottom: "var(--pad-bottom)" }}>
      <TopBar
        voltar={voltar}
        acao={
          <button
            onClick={() => setModalEditar(true)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              background: "var(--card)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            <Icon name="edit" size={16} color="var(--ink)" strokeWidth={2} />
          </button>
        }
      />

      <div style={{ padding: "4px 20px 0" }}>
        {/* Cabeçalho com cor da caixinha */}
        <div
          style={{
            background: `linear-gradient(135deg, ${cx.cor}, ${cx.cor}CC)`,
            color: "#fff",
            borderRadius: 24,
            padding: 22,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: -40,
              top: -40,
              width: 160,
              height: 160,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.10)",
            }}
          />
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  background: "rgba(255,255,255,0.22)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="piggy" size={20} color="#fff" strokeWidth={2.2} />
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                }}
              >
                {cx.nome}
              </div>
            </div>

            <div
              style={{
                marginTop: 14,
                fontSize: 12,
                fontWeight: 600,
                opacity: 0.85,
              }}
            >
              Você já juntou
            </div>
            <div
              style={{
                fontSize: 36,
                fontWeight: 800,
                letterSpacing: "-0.03em",
              }}
            >
              {fmtBRL(atual, ocultar)}
            </div>

            {cx.meta > 0 && (
              <>
                <div
                  style={{
                    marginTop: 12,
                    height: 8,
                    background: "rgba(255,255,255,0.2)",
                    borderRadius: 8,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      background: "#fff",
                      transition: "width .3s ease",
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 6,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  <span style={{ opacity: 0.9 }}>
                    Meta {fmtBRLCompacto(cx.meta, ocultar)}
                  </span>
                  <span>{pct.toFixed(0)}%</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Lembrança / estado da meta */}
        {lembranca && (
          <Card
            style={{
              marginTop: 14,
              padding: 16,
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                flexShrink: 0,
                background: lembranca.completo
                  ? "#DAF5E9"
                  : lembranca.vencido
                    ? "#FFE5EA"
                    : "color-mix(in oklab, var(--primary) 14%, transparent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon
                name={
                  lembranca.completo
                    ? "check"
                    : lembranca.vencido
                      ? "bell"
                      : "target"
                }
                size={18}
                color={
                  lembranca.completo
                    ? "#1B9E6A"
                    : lembranca.vencido
                      ? "#D63A55"
                      : "var(--primary)"
                }
                strokeWidth={2.4}
              />
            </div>
            <div style={{ flex: 1 }}>
              {lembranca.completo ? (
                <>
                  <div
                    style={{ fontSize: 14, fontWeight: 800, color: "#1B9E6A" }}
                  >
                    Meta alcançada! 🎉
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      fontWeight: 500,
                      marginTop: 2,
                    }}
                  >
                    Você juntou tudo. Hora de aproveitar.
                  </div>
                </>
              ) : lembranca.vencido ? (
                <>
                  <div
                    style={{ fontSize: 14, fontWeight: 800, color: "#D63A55" }}
                  >
                    Prazo vencido
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      fontWeight: 500,
                      marginTop: 2,
                    }}
                  >
                    Ainda faltam {fmtBRL(lembranca.faltam, ocultar)}. Reajuste a
                    data ou a meta.
                  </div>
                </>
              ) : lembranca.semData ? (
                <>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: "var(--ink)",
                    }}
                  >
                    Faltam {fmtBRL(lembranca.faltam, ocultar)}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      fontWeight: 500,
                      marginTop: 2,
                    }}
                  >
                    Sem prazo definido. Edite a caixinha para receber uma
                    sugestão de quanto guardar por mês.
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: "var(--ink)",
                    }}
                  >
                    Guarde {fmtBRL(lembranca.valor, ocultar)} por{" "}
                    {lembranca.tipo === "mensal"
                      ? "mês"
                      : lembranca.tipo === "semanal"
                        ? "semana"
                        : "dia"}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      fontWeight: 500,
                      marginTop: 2,
                    }}
                  >
                    Para chegar em {rotuloDataCurto(lembranca.dataMeta)} (
                    {lembranca.dias}{" "}
                    {lembranca.dias === 1 ? "dia restante" : "dias restantes"}).
                  </div>
                </>
              )}
            </div>
          </Card>
        )}

        {/* CTA depositar */}
        <button
          onClick={() => setModalDeposito(true)}
          style={{
            width: "100%",
            marginTop: 14,
            padding: "14px",
            borderRadius: 16,
            border: "none",
            cursor: "pointer",
            background: `linear-gradient(135deg, ${cx.cor}, ${cx.cor}CC)`,
            color: "#fff",
            fontSize: 14,
            fontWeight: 800,
            fontFamily: "inherit",
            boxShadow: `0 6px 16px ${cx.cor}55`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Icon name="plus" size={18} color="#fff" strokeWidth={2.6} />
          Adicionar valor
        </button>

        {/* Histórico */}
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--muted)",
            textTransform: "uppercase",
            letterSpacing: 0.4,
            padding: "24px 4px 8px",
          }}
        >
          {depositos.length === 0
            ? "Nenhum depósito ainda"
            : `${depositos.length} depósito${depositos.length === 1 ? "" : "s"}`}
        </div>
        {depositos.length > 0 && (
          <Card style={{ padding: "4px 16px" }}>
            {depositos.map((d, i) => {
              let labelOrigem = "Do orçamento";
              if (d.origem?.tipo === "entrada") {
                let desc = d.origem.descricao;
                if (!desc && d.origem.entradaId) {
                  desc = entradas.find((t) => t.id === d.origem.entradaId)?.descricao;
                }
                labelOrigem = `Da entrada: ${desc || "removida"}`;
              }
              return (
                <div
                  key={d.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 0",
                    borderTop: i === 0 ? "none" : "1px solid var(--linha)",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      background: `${cx.cor}22`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon
                      name="plus"
                      size={16}
                      color={cx.cor}
                      strokeWidth={2.4}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "var(--ink)",
                      }}
                    >
                      {fmtBRL(d.valor, ocultar)}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--muted)",
                        fontWeight: 600,
                        marginTop: 1,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {rotuloDataCurto(d.data)} · {labelOrigem}
                    </div>
                  </div>
                </div>
              );
            })}
          </Card>
        )}

        {/* Excluir */}
        <button
          onClick={() => setConfirmarExclusao(true)}
          style={{
            width: "100%",
            marginTop: 22,
            padding: "12px",
            borderRadius: 14,
            border: "none",
            cursor: "pointer",
            background: "transparent",
            color: "#D63A55",
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Icon name="trash" size={14} color="#D63A55" strokeWidth={2.2} />
          Excluir caixinha
        </button>
      </div>

      {modalDeposito && (
        <ModalDeposito
          cor={cx.cor}
          gruposEntrada={gruposEntrada}
          alocadoPorDescricao={alocadoPorDescricao}
          onFechar={() => setModalDeposito(false)}
          onSalvar={(dep) => {
            depositarCaixinha(cx.id, dep);
            setModalDeposito(false);
          }}
        />
      )}
      {modalEditar && (
        <ModalCaixinha
          editando={cx}
          onFechar={() => setModalEditar(false)}
          onSalvar={(dados) => {
            salvarCaixinha({ ...cx, ...dados });
            setModalEditar(false);
          }}
        />
      )}
      {confirmarExclusao && (
        <ConfirmModal
          titulo={`Excluir "${cx.nome}"?`}
          mensagem={
            (cx.depositos || []).length > 0
              ? `Os ${cx.depositos.length} depósito${cx.depositos.length === 1 ? "" : "s"} guardado${cx.depositos.length === 1 ? "" : "s"} (${fmtBRL(valorAtual(cx), ocultar)}) serão perdidos.`
              : "Essa caixinha será removida permanentemente."
          }
          onCancelar={() => setConfirmarExclusao(false)}
          onConfirmar={onConfirmarExclusao}
        />
      )}
    </div>
  );
}

// ─────────── Card de caixinha (usado na lista e no dashboard) ───────────
export function CardCaixinha({ cx, ocultar, onClick }) {
  const atual = valorAtual(cx);
  const pct = cx.meta > 0 ? Math.min(100, (atual / cx.meta) * 100) : 0;
  const lembranca = calcularLembranca(cx);

  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--card)",
        borderRadius: 18,
        padding: 16,
        boxShadow:
          "0 1px 2px rgba(20,16,24,0.04), 0 4px 12px rgba(20,16,24,0.03)",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: 4,
          background: cx.cor,
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginLeft: 4,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            background: `${cx.cor}22`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="piggy" size={18} color={cx.cor} strokeWidth={2.2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: "var(--ink)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {cx.nome}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--muted)",
              fontWeight: 600,
              marginTop: 1,
            }}
          >
            {cx.meta > 0
              ? `${fmtBRLCompacto(atual, ocultar)} de ${fmtBRLCompacto(cx.meta, ocultar)}`
              : `Guardado: ${fmtBRLCompacto(atual, ocultar)}`}
          </div>
        </div>
        <Icon
          name="chevron-right"
          size={16}
          color="var(--muted)"
          strokeWidth={2}
        />
      </div>

      {cx.meta > 0 && (
        <div style={{ marginLeft: 4, marginTop: 10 }}>
          <BarraProgresso valor={atual} max={cx.meta} cor={cx.cor} altura={6} />
        </div>
      )}

      {lembranca &&
        !lembranca.completo &&
        !lembranca.vencido &&
        !lembranca.semData && (
          <div
            style={{
              marginLeft: 4,
              marginTop: 10,
              padding: "8px 10px",
              borderRadius: 10,
              background: `${cx.cor}14`,
              fontSize: 11,
              fontWeight: 700,
              color: cx.cor,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon name="target" size={12} color={cx.cor} strokeWidth={2.4} />
            Guarde {fmtBRLCompacto(lembranca.valor, ocultar)} por{" "}
            {lembranca.tipo === "mensal"
              ? "mês"
              : lembranca.tipo === "semanal"
                ? "semana"
                : "dia"}
          </div>
        )}
    </div>
  );
}

// ─────────── Modal: criar / editar caixinha ───────────
function ModalCaixinha({ editando, onFechar, onSalvar }) {
  const [nome, setNome] = React.useState(editando?.nome ?? "");
  const [cor, setCor] = React.useState(editando?.cor ?? CORES_CAIXINHA[0]);
  const [temMeta, setTemMeta] = React.useState(
    editando ? !!editando.meta : false,
  );
  const [meta, setMeta] = React.useState(
    editando?.meta ? String(editando.meta).replace(".", ",") : "",
  );
  const [dataMeta, setDataMeta] = React.useState(editando?.dataMeta ?? "");

  const metaNum = parseFloat(meta.replace(/\./g, "").replace(",", ".")) || 0;
  const valido = nome.trim().length > 0;

  const salvar = () => {
    if (!valido) return;
    onSalvar({
      nome: nome.trim(),
      cor,
      meta: temMeta && metaNum > 0 ? metaNum : 0,
      dataMeta: temMeta && metaNum > 0 && dataMeta ? dataMeta : "",
    });
  };

  return (
    <ModalShell
      titulo={editando ? "Editar caixinha" : "Nova caixinha"}
      onFechar={onFechar}
      onSalvar={salvar}
      salvarAtivo={valido}
    >
      <Campo label="Nome">
        <input
          autoFocus
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Viagem para a praia"
          style={inputStyle}
        />
      </Campo>

      <Campo label="Cor">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {CORES_CAIXINHA.map((c) => {
            const sel = cor === c;
            return (
              <button
                key={c}
                onClick={() => setCor(c)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  background: c,
                  border: sel
                    ? "3px solid var(--ink)"
                    : "3px solid transparent",
                  cursor: "pointer",
                  padding: 0,
                }}
              />
            );
          })}
        </div>
      </Campo>

      <Campo label="Meta (opcional)">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: temMeta ? 10 : 0,
          }}
        >
          <Toggle ativo={temMeta} onChange={setTemMeta} />
          <span
            style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}
          >
            {temMeta ? "Definir um valor-alvo" : "Sem meta — só vou juntando"}
          </span>
        </div>
        {temMeta && (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 6,
              }}
            >
              <span
                style={{ fontSize: 14, color: "var(--muted)", fontWeight: 700 }}
              >
                R$
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={meta}
                onChange={(e) => setMeta(e.target.value)}
                placeholder="0,00"
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
                <Icon
                  name="calendar"
                  size={16}
                  color="var(--muted)"
                  strokeWidth={2}
                />
                <span
                  style={{
                    flex: 1,
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--muted)",
                  }}
                >
                  Até quando? <span style={{ opacity: 0.7 }}>(opcional)</span>
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
          </>
        )}
      </Campo>
    </ModalShell>
  );
}

// ─────────── Modal: depositar valor ───────────
function ModalDeposito({ cor, gruposEntrada = [], alocadoPorDescricao = {}, onFechar, onSalvar }) {
  const [valor, setValor] = React.useState("0,00");
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
  const grupoEscolhido = gruposComSaldo.find((g) => g.descricao === entradaDesc);
  const excedeEntrada =
    origemTipo === "entrada" && grupoEscolhido && valorNum > grupoEscolhido.disponivel + 0.001;
  const origemValida =
    origemTipo === "orcamento" || (grupoEscolhido && !excedeEntrada);
  const podeSalvar = valorNum > 0 && origemValida;

  const salvar = () => {
    if (!podeSalvar) return;
    const origem =
      origemTipo === "entrada"
        ? { tipo: "entrada", descricao: entradaDesc }
        : { tipo: "orcamento" };
    onSalvar({ id: `dp-${Date.now()}`, valor: valorNum, data, origem });
  };

  return (
    <ModalShell
      titulo="Adicionar valor"
      onFechar={onFechar}
      onSalvar={salvar}
      salvarAtivo={podeSalvar}
      corAcento={cor}
    >
      <label
        style={{
          display: "block",
          textAlign: "center",
          padding: "14px 0 6px",
          position: "relative",
          cursor: "text",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--muted)",
            textTransform: "uppercase",
            letterSpacing: 0.6,
          }}
        >
          Valor
        </div>
        <div
          style={{
            fontSize: 42,
            fontWeight: 800,
            color: "var(--ink)",
            letterSpacing: "-0.03em",
            marginTop: 4,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <span
            style={{
              fontSize: 20,
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
          aria-label="Valor do depósito"
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

      <Campo label="Data">
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
          <Icon
            name="calendar"
            size={16}
            color="var(--muted)"
            strokeWidth={2}
          />
          <span
            style={{
              flex: 1,
              fontSize: 13,
              fontWeight: 700,
              color: "var(--muted)",
            }}
          >
            Quando
          </span>
          <input
            type="date"
            value={data}
            max={hojeISO()}
            onChange={(e) => setData(e.target.value)}
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
      </Campo>

      <Campo label="Origem do valor">
        <div
          style={{
            display: "flex",
            gap: 6,
            padding: 4,
            borderRadius: 12,
            background: "var(--card-2)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
          }}
        >
          {[
            { id: "orcamento", label: "Orçamento" },
            { id: "entrada", label: "Entrada", disabled: !temEntradas },
          ].map((opt) => {
            const sel = origemTipo === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  if (opt.disabled) return;
                  setOrigemTipo(opt.id);
                  if (opt.id === "entrada" && !entradaDesc && temEntradas) {
                    setEntradaDesc(gruposComSaldo[0].descricao);
                  }
                }}
                disabled={opt.disabled}
                style={{
                  flex: 1,
                  padding: "9px 8px",
                  borderRadius: 10,
                  border: "none",
                  background: sel ? "var(--card)" : "transparent",
                  color: opt.disabled ? "var(--linha)" : sel ? "var(--ink)" : "var(--muted)",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: opt.disabled ? "default" : "pointer",
                  fontFamily: "inherit",
                  boxShadow: sel ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                  transition: "background .15s",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {origemTipo === "orcamento" && (
          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              color: "var(--muted)",
              fontWeight: 500,
              padding: "0 4px",
              lineHeight: 1.4,
            }}
          >
            Será debitado do orçamento do mês.
          </div>
        )}

        {origemTipo === "entrada" && temEntradas && (
          <div
            style={{
              marginTop: 10,
              display: "flex",
              flexDirection: "column",
              gap: 6,
              maxHeight: 220,
              overflowY: "auto",
            }}
          >
            {gruposComSaldo.map((g) => {
              const sel = entradaDesc === g.descricao;
              const semSaldo = g.disponivel <= 0;
              return (
                <button
                  key={g.descricao}
                  onClick={() => !semSaldo && setEntradaDesc(g.descricao)}
                  disabled={semSaldo}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: sel ? `2px solid #1B9E6A` : "2px solid transparent",
                    background: "var(--card-2)",
                    cursor: semSaldo ? "default" : "pointer",
                    fontFamily: "inherit",
                    textAlign: "left",
                    opacity: semSaldo ? 0.5 : 1,
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 10,
                      background: "#DAF5E9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon name="plus" size={14} color="#1B9E6A" strokeWidth={2.6} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--ink)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {g.descricao}
                      {g.count > 1 && (
                        <span style={{ color: "var(--muted)", fontWeight: 600 }}>
                          {" "}· {g.count} lançamentos
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--muted)",
                        fontWeight: 600,
                        marginTop: 1,
                      }}
                    >
                      disponível {fmtBRLCompacto(g.disponivel)}
                      {g.alocado > 0 && ` · alocado ${fmtBRLCompacto(g.alocado)}`}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {origemTipo === "entrada" && excedeEntrada && (
          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              color: "#D63A55",
              fontWeight: 700,
              padding: "0 4px",
            }}
          >
            Valor excede o disponível desta entrada.
          </div>
        )}
      </Campo>
    </ModalShell>
  );
}

// ─────────── Wrapper de modal centralizado (mesmo estilo do add-expense) ───────────
function ModalShell({
  titulo,
  onFechar,
  onSalvar,
  salvarAtivo,
  corAcento,
  children,
}) {
  return (
    <div
      onClick={onFechar}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: "rgba(20, 16, 24, 0.45)",
        backdropFilter: "blur(12px) saturate(140%)",
        WebkitBackdropFilter: "blur(12px) saturate(140%)",
        animation: "fadeIn .28s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 440,
          maxHeight: "calc(100vh - 40px)",
          overflowY: "auto",
          overflowX: "hidden",
          background: "var(--bg)",
          borderRadius: 28,
          padding: "16px 20px 24px",
          boxShadow:
            "0 24px 60px rgba(0,0,0,0.28), 0 4px 12px rgba(0,0,0,0.08)",
          animation: "scaleIn .34s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <button
            onClick={onFechar}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--muted)",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: "var(--ink)",
              letterSpacing: "-0.01em",
            }}
          >
            {titulo}
          </div>
          <button
            onClick={onSalvar}
            disabled={!salvarAtivo}
            style={{
              background: salvarAtivo
                ? corAcento || "var(--primary)"
                : "var(--linha)",
              color: salvarAtivo ? "#fff" : "var(--muted)",
              border: "none",
              padding: "6px 14px",
              borderRadius: 999,
              fontWeight: 800,
              fontSize: 13,
              cursor: salvarAtivo ? "pointer" : "default",
              fontFamily: "inherit",
            }}
          >
            Salvar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Campo({ label, children }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "var(--muted)",
          textTransform: "uppercase",
          letterSpacing: 0.4,
          padding: "0 4px 6px",
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function Toggle({ ativo, onChange }) {
  return (
    <div
      onClick={() => onChange(!ativo)}
      style={{
        width: 42,
        height: 26,
        borderRadius: 14,
        background: ativo ? "var(--primary)" : "var(--surface-sunken)",
        position: "relative",
        cursor: "pointer",
        transition: "background .15s",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 2,
          left: ativo ? 18 : 2,
          width: 22,
          height: 22,
          borderRadius: 11,
          background: "#fff",
          transition: "left .15s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        }}
      />
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: "none",
  background: "var(--card-2)",
  outline: "none",
  fontSize: 14,
  fontWeight: 600,
  color: "var(--ink)",
  fontFamily: "inherit",
  boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
  boxSizing: "border-box",
};
