// dashboard.jsx — Tela Início (visão geral do mês)

import React from "react";
import {
  CATEGORIAS,
  MESES_CURTO,
  fmtBRL,
  fmtBRLCompacto,
  rotuloMes,
  totalEntradas,
  totalGeral,
  totalPorCategoria,
  txDoMes,
} from "../data.js";
import { Icon } from "../ui/icons.jsx";
import { Card, ItemTransacao, SeletorMes } from "../ui/common.jsx";
import { CardCaixinha } from "./caixinhas.jsx";
import { calcularNotificacoes } from "./notificacoes.jsx";
import { dispararPendentes } from "../lib/notifications.js";
import { SimularGastoModal } from "../modals/simular-gasto.jsx";
import { vibrar } from "../lib/haptics.js";
import { COR_POS, COR_NEG, COR_AVISO } from "../lib/colors.js";
import { computeInsights } from "../lib/insights.jsx";

export function DashboardScreen({ ctx }) {
  const {
    txs,
    mes,
    setMes,
    todosMeses,
    mesAnterior,
    ocultar,
    setOcultar,
    irPara,
    orcamentos,
    preferences,
    caixinhas,
    recorrentes,
    usuario,
    ehDesktop,
    convitesRecebidos = [],
    notificacoesParceria = [],
    partnerTxs = [],
    partnerNome = '',
    partnerOrcamentos = {},
    partnerOrcamentoMensal = 0,
    partnerUid,
  } = ctx;
  const notifInfo = React.useMemo(
    () => calcularNotificacoes(txs, recorrentes, preferences?.notifLidas || [], convitesRecebidos, notificacoesParceria, orcamentos),
    [txs, recorrentes, preferences?.notifLidas, convitesRecebidos, notificacoesParceria, orcamentos],
  );
  const totalNotif = notifInfo.naoLidas;

  // Dispara notificações nativas (se já houver permissão) ao abrir o app.
  React.useEffect(() => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;
    dispararPendentes({
      proximas: notifInfo.proximas,
      terminando: notifInfo.terminando,
      orcEstourados: notifInfo.orcEstourados,
      orcProximos: notifInfo.orcProximos,
      lidas: preferences?.notifLidas || [],
      idsAtivos: notifInfo.idsAtivos,
    });
  }, [notifInfo, preferences?.notifLidas]);
  const primeiroNome = (preferences.nome?.trim() || usuario?.displayName || "")
    .trim()
    .split(" ")[0];

  const txMes = txDoMes(txs, mes);
  const txMesAnt = mesAnterior ? txDoMes(txs, mesAnterior) : [];
  const total = totalGeral(txMes);
  const totalAnt = totalGeral(txMesAnt);
  const entradas = totalEntradas(txMes);
  const delta = totalAnt > 0 ? ((total - totalAnt) / totalAnt) * 100 : 0;
  const somaOrcCats = Object.values(orcamentos).reduce((s, v) => s + v, 0);
  const orcBase =
    preferences.orcamentoMensal > 0 ? preferences.orcamentoMensal : somaOrcCats;
  // Depósitos em caixinhas no mês exibido — dinheiro guardado, não disponível.
  // Vale tanto pra origem "orcamento" quanto "entrada": em ambos os casos o
  // valor saiu do que pode ser usado e foi pra reserva.
  // Saques (valor < 0) são ignorados aqui: eles já voltam como entrada do mês,
  // que é contada na soma de `entradas` — somar de novo daria duplicidade.
  // Em conta compartilhada, cada lado é abatido só pelos depósitos que ele
  // mesmo fez (`feitoPor === uid`) — depósito do parceiro é descontado do
  // saldo dele, não do meu. Conta solo: tudo é "meu" (sem feitoPor).
  const meuUid = usuario?.uid;
  const guardadoPorUid = React.useMemo(() => {
    const m = {};
    for (const c of caixinhas || []) {
      for (const d of c.depositos || []) {
        if (!d.data || !d.data.startsWith(mes)) continue;
        if (!(d.valor > 0)) continue;
        const dono = d.feitoPor || meuUid || "_anon";
        m[dono] = (m[dono] || 0) + d.valor;
      }
    }
    return m;
  }, [caixinhas, mes, meuUid]);
  const guardadoEmCaixinhas = guardadoPorUid[meuUid || "_anon"] || 0;
  const guardadoParceiro = partnerUid ? guardadoPorUid[partnerUid] || 0 : 0;
  // Entradas do mês somam ao orçamento; caixinhas guardadas abatem.
  const orcTotal = orcBase + entradas - guardadoEmCaixinhas;
  const restante = orcTotal - total;

  // No Dashboard, "Últimos gastos" mostra somente OS MEUS — txs do parceiro
  // ficam na aba de Transações (por opção de UX: o resumo aqui é pessoal).
  const recentes = txMes.slice(0, 3);

  // Já precisamos das txs do parceiro pra o resumo no card de saldo abaixo.
  const parceiroDoMes = React.useMemo(
    () => txDoMes(partnerTxs, mes),
    [partnerTxs, mes],
  );
  const totalParceiro = totalGeral(parceiroDoMes);
  const entradasParceiro = totalEntradas(parceiroDoMes);
  const somaOrcCatsParceiro = Object.values(partnerOrcamentos).reduce((s, v) => s + v, 0);
  const orcBaseParceiro = partnerOrcamentoMensal > 0 ? partnerOrcamentoMensal : somaOrcCatsParceiro;
  const orcTotalParceiro = orcBaseParceiro + entradasParceiro - guardadoParceiro;
  const restanteParceiro = orcTotalParceiro - totalParceiro;
  const disponivelConjunto = restante + restanteParceiro;
  const ehCompartilhado = !!partnerUid;

  // Próximas a vencer — recorrentes e parcelas dos próximos 35 dias, ordenadas
  // do mais próximo para o mais distante. Independente do mês selecionado.
  const proximas = React.useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const limite = new Date(hoje);
    limite.setDate(limite.getDate() + 35);
    const candidatas = txs.filter((t) => {
      if (t.tipo === "entrada") return false;
      if (!t.recorrenteId && !t.parcelas) return false;
      const [y, m, d] = t.data.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      return dt >= hoje && dt <= limite;
    });
    candidatas.sort((a, b) => a.data.localeCompare(b.data));
    return candidatas.slice(0, 3);
  }, [txs]);

  // Top categorias com orçamento estourando ou perto do limite
  const orcCategorias = React.useMemo(() => {
    const porCat = totalPorCategoria(txMes);
    const lista = Object.entries(orcamentos)
      .filter(([, v]) => v > 0)
      .map(([id, orc]) => {
        const gasto = porCat[id] || 0;
        const pct = (gasto / orc) * 100;
        return { id, gasto, orc, pct, cat: CATEGORIAS[id] };
      })
      .filter((d) => d.cat);
    lista.sort((a, b) => b.pct - a.pct);
    return lista.slice(0, 3);
  }, [txMes, orcamentos]);

  // Insights textuais — banco de variações pra rotacionar no card.
  // A lógica vive em lib/insights.jsx (função pura), aqui só memoizamos.
  const insights = React.useMemo(
    () =>
      computeInsights({
        txMes,
        txMesAnt,
        total,
        totalAnt,
        delta,
        ocultar,
        mes,
        orcTotal,
        restante,
        entradas,
        caixinhas,
        proximas,
        orcCategorias,
      }),
    [
      txMes,
      txMesAnt,
      total,
      totalAnt,
      delta,
      ocultar,
      mes,
      orcTotal,
      restante,
      entradas,
      caixinhas,
      proximas,
      orcCategorias,
    ],
  );


  // Modal de simulação de gasto — discreto, abre via botão sob os insights.
  const [simularAberto, setSimularAberto] = React.useState(false);

  // Rotaciona os insights a cada 10s. Se só houver 1, fica parado.
  const [insightIdx, setInsightIdx] = React.useState(0);
  React.useEffect(() => {
    setInsightIdx(0);
  }, [insights.length]);
  React.useEffect(() => {
    if (insights.length <= 1) return;
    const id = setInterval(() => {
      setInsightIdx((i) => (i + 1) % insights.length);
    }, 10000);
    return () => clearInterval(id);
  }, [insights.length]);
  const insightAtual = insights[insightIdx] || null;

  // Swipe manual no card de insights — não interfere no auto-rotate.
  const swipeInsightRef = React.useRef({ x: 0, y: 0, ativo: false });
  const irInsight = React.useCallback(
    (dir) => {
      if (insights.length <= 1) return;
      setInsightIdx((i) => (i + dir + insights.length) % insights.length);
    },
    [insights.length]
  );
  const onInsightTouchStart = (e) => {
    const t = e.touches?.[0];
    if (!t) return;
    swipeInsightRef.current = { x: t.clientX, y: t.clientY, ativo: true };
  };
  const onInsightTouchEnd = (e) => {
    const s = swipeInsightRef.current;
    if (!s.ativo) return;
    swipeInsightRef.current.ativo = false;
    const t = e.changedTouches?.[0];
    if (!t) return;
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      irInsight(dx < 0 ? 1 : -1);
    }
  };
  const onInsightPointerDown = (e) => {
    if (e.pointerType === "touch") return; // touch já é tratado
    swipeInsightRef.current = { x: e.clientX, y: e.clientY, ativo: true };
  };
  const onInsightPointerUp = (e) => {
    const s = swipeInsightRef.current;
    if (!s.ativo || e.pointerType === "touch") return;
    swipeInsightRef.current.ativo = false;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      irInsight(dx < 0 ? 1 : -1);
    }
  };
  const temEntrada = entradas > 0;
  const hojeHora = new Date().getHours();
  const saudacao =
    hojeHora < 12 ? "Bom dia" : hojeHora < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className={ehDesktop ? "cols-desktop" : undefined} style={{ paddingBottom: "var(--pad-bottom)" }}>
      {/* Cabeçalho — mesma métrica vertical do TopBar para padronizar todas as abas */}
      <div
        className={ehDesktop ? "col-span-all" : undefined}
        style={{
          padding: "var(--pad-top) 20px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: 32,
          }}
        >
          <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>
            {saudacao}
            {primeiroNome && ","}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setOcultar(!ocultar)}
              className="glass-surface"
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow:
                  "0 4px 14px rgba(20,16,24,0.08), inset 0 1px 0 rgba(255,255,255,0.3)",
              }}
            >
              <Icon
                name={ocultar ? "eye-off" : "eye"}
                size={18}
                color="var(--ink)"
                strokeWidth={2}
              />
            </button>
            <button
              onClick={() => irPara("notificacoes")}
              className="glass-surface"
              aria-label={`Notificações${totalNotif ? ` (${totalNotif})` : ""}`}
              style={{
                position: "relative",
                width: 36,
                height: 36,
                borderRadius: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow:
                  "0 4px 14px rgba(20,16,24,0.08), inset 0 1px 0 rgba(255,255,255,0.3)",
              }}
            >
              <Icon name="bell" size={18} color="var(--ink)" strokeWidth={2} />
              {totalNotif > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: -5,
                    right: -5,
                    minWidth: 14,
                    height: 14,
                    padding: "0 3px",
                    borderRadius: 7,
                    background: COR_NEG,
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 800,
                    lineHeight: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 6px rgba(214,58,85,0.4)",
                    border: "1.5px solid var(--bg)",
                    boxSizing: "content-box",
                  }}
                >
                  {totalNotif > 9 ? "9+" : totalNotif}
                </div>
              )}
            </button>
            <button
              onClick={() => irPara("perfil")}
              className="glass-surface"
              style={{
                width: 36,
                height: 36,
                padding: 0,
                borderRadius: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow:
                  "0 4px 14px rgba(20,16,24,0.08), inset 0 1px 0 rgba(255,255,255,0.3)",
                overflow: "hidden",
              }}
            >
              {(preferences.fotoUrl || usuario?.photoURL) ? (
                <img
                  src={preferences.fotoUrl || usuario.photoURL}
                  alt={primeiroNome || "Perfil"}
                  referrerPolicy="no-referrer"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    borderRadius: 18,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 18,
                    background:
                      "linear-gradient(135deg, var(--primary), var(--primary-2))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: 14,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {primeiroNome ? primeiroNome[0].toUpperCase() : "+"}
                </div>
              )}
            </button>
          </div>
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "var(--ink)",
            letterSpacing: "-0.02em",
            marginTop: 6,
          }}
        >
          {primeiroNome ? `${primeiroNome} ✦` : "Bem-vindo ✦"}
        </div>
      </div>

      {/* Card principal — saldo do mês */}
      <div className={ehDesktop ? "col-span-all" : undefined} style={{ padding: "4px 20px 0" }}>
        <div
          className="card-saldo"
          style={{
            background:
              "linear-gradient(135deg, var(--primary) 0%, var(--primary-2) 50%, var(--primary) 100%)",
            backgroundSize: "200% 200%",
            color: "#fff",
            borderRadius: 28,
            padding: 22,
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 8px 24px color-mix(in oklab, var(--primary) 22%, transparent)",
          }}
        >
          {/* brilho diagonal que atravessa o card */}
          <div
            aria-hidden="true"
            className="card-saldo__brilho"
            style={{
              position: "absolute",
              top: 0,
              left: "-40%",
              width: "60%",
              height: "100%",
              background:
                "linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.10) 50%, transparent 65%)",
              pointerEvents: "none",
            }}
          />
          {/* círculos decorativos (com flutuação suave) */}
          <div
            aria-hidden="true"
            className="card-saldo__bolha card-saldo__bolha--a"
            style={{
              position: "absolute",
              right: -40,
              top: -40,
              width: 160,
              height: 160,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
            }}
          />
          <div
            aria-hidden="true"
            className="card-saldo__bolha card-saldo__bolha--b"
            style={{
              position: "absolute",
              right: 30,
              bottom: -60,
              width: 110,
              height: 110,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              position: "relative",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.85 }}>
              Gasto em {rotuloMes(mes)}
            </div>
            <SeletorMes mes={mes} setMes={setMes} todosMeses={todosMeses} />
          </div>

          <div
            style={{
              marginTop: 10,
              fontSize: 36,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              position: "relative",
            }}
          >
            {fmtBRL(total, ocultar)}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 6,
              position: "relative",
            }}
          >
            {totalAnt > 0 && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.18)",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                <span>{delta >= 0 ? "▲" : "▼"}</span>
                <span>{Math.abs(delta).toFixed(1)}%</span>
                <span style={{ opacity: 0.8, fontWeight: 600 }}>
                  vs. mês anterior
                </span>
              </div>
            )}
          </div>

          <div
            style={{
              marginTop: 18,
              paddingTop: 14,
              borderTop: "1px solid rgba(255,255,255,0.18)",
              display: "flex",
              justifyContent: "space-between",
              position: "relative",
            }}
          >
            <div>
              <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 600 }}>
                Orçamento
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>
                {fmtBRL(orcTotal, ocultar)}
              </div>
              {temEntrada && (
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    opacity: 0.85,
                    marginTop: 2,
                  }}
                >
                  +{fmtBRL(entradas, ocultar)} entradas
                </div>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 600 }}>
                {restante >= 0 ? "Restante" : "Acima do orçamento"}
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  marginTop: 2,
                  color: restante >= 0 ? "#D9F5C8" : "#FFD0D9",
                }}
              >
                {fmtBRL(Math.abs(restante), ocultar)}
              </div>
            </div>
          </div>

          {/* Resumo do parceiro — só aparece em conta compartilhada */}
          {ehCompartilhado && (
            <div
              style={{
                marginTop: 14,
                paddingTop: 12,
                borderTop: "1px dashed rgba(255,255,255,0.22)",
                position: "relative",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 10,
                  fontWeight: 700,
                  opacity: 0.78,
                  letterSpacing: 0.4,
                  textTransform: "uppercase",
                }}
              >
                <span>
                  {partnerNome || "Parceiro"}
                </span>
                <span style={{ opacity: 0.85 }}>
                  {fmtBRLCompacto(totalParceiro, ocultar)} gasto
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  opacity: 0.85,
                }}
              >
                <span>
                  Orçamento {fmtBRLCompacto(orcTotalParceiro, ocultar)}
                </span>
                <span
                  style={{
                    color: restanteParceiro >= 0 ? "#D9F5C8" : "#FFD0D9",
                    fontWeight: 700,
                  }}
                >
                  {restanteParceiro >= 0 ? "Resta " : "Acima "}
                  {fmtBRLCompacto(Math.abs(restanteParceiro), ocultar)}
                </span>
              </div>

              {/* Disponível conjunto dos dois */}
              <div
                style={{
                  marginTop: 10,
                  padding: "8px 12px",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    opacity: 0.9,
                    letterSpacing: 0.3,
                    textTransform: "uppercase",
                  }}
                >
                  Disponível juntos
                </span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: disponivelConjunto >= 0 ? "#D9F5C8" : "#FFD0D9",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {fmtBRL(Math.abs(disponivelConjunto), ocultar)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Insights — uma análise por vez, rotaciona com crossfade a cada 10s */}
      {insightAtual && (
        <div className={ehDesktop ? "col-span-all" : undefined} style={{ padding: "16px 20px 0" }}>
          <Card
            style={{ padding: "14px 16px", touchAction: "pan-y", userSelect: "none" }}
            onTouchStart={onInsightTouchStart}
            onTouchEnd={onInsightTouchEnd}
            onPointerDown={onInsightPointerDown}
            onPointerUp={onInsightPointerUp}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    background: "color-mix(in oklab, var(--primary) 14%, transparent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon name="sparkle" size={14} color="var(--primary)" strokeWidth={2.4} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
                  Insights do mês
                </div>
              </div>
              {insights.length > 1 && (
                <div style={{ display: "flex", gap: 4 }}>
                  {insights.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setInsightIdx(i)}
                      aria-label={`Insight ${i + 1}`}
                      style={{
                        width: i === insightIdx ? 14 : 6,
                        height: 6,
                        borderRadius: 3,
                        border: "none",
                        padding: 0,
                        background:
                          i === insightIdx
                            ? "var(--primary)"
                            : "color-mix(in oklab, var(--ink) 14%, transparent)",
                        cursor: "pointer",
                        transition: "width .25s ease, background .25s ease",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
            <div
              style={{
                position: "relative",
                minHeight: 38,
              }}
            >
              <div
                key={insightIdx}
                className="insight-fade"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    background: insightAtual.cor,
                    marginTop: 6,
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    fontSize: 13,
                    lineHeight: 1.45,
                    color: "var(--muted)",
                    fontWeight: 500,
                  }}
                >
                  {insightAtual.texto}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Botão discreto: simular um gasto e checar se cabe no orçamento */}
      <div className={ehDesktop ? "col-span-all" : undefined} style={{ padding: "10px 20px 0" }}>
        <button
          onClick={() => { vibrar(); setSimularAberto(true); }}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "10px 14px",
            borderRadius: 14,
            border: "1px dashed color-mix(in oklab, var(--primary) 35%, transparent)",
            background: "color-mix(in oklab, var(--primary) 6%, transparent)",
            color: "var(--primary)",
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "inherit",
            cursor: "pointer",
            letterSpacing: "-0.005em",
          }}
        >
          <Icon name="target" size={14} color="var(--primary)" strokeWidth={2.4} />
          Simular um gasto
        </button>
      </div>

      {/* Próximas a vencer — recorrentes e parcelas dos próximos 35 dias */}
      {proximas.length > 0 && (
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
              Próximas a vencer
            </div>
            <button
              onClick={() => irPara("recorrentes")}
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
              Ver tudo →
            </button>
          </div>
          <Card style={{ padding: "4px 16px" }}>
            {proximas.map((tx, i) => {
              const [, mm, dd] = tx.data.split("-").map(Number);
              const diasAte = Math.ceil(
                (new Date(tx.data + "T12:00:00") - new Date()) /
                  (1000 * 60 * 60 * 24),
              );
              const urgente = diasAte <= 3;
              const rotuloPrazo =
                diasAte <= 0
                  ? "Hoje"
                  : diasAte === 1
                    ? "Amanhã"
                    : `Em ${diasAte} dias`;
              return (
                <div
                  key={tx.id}
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
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: urgente
                        ? `color-mix(in oklab, ${COR_NEG} 12%, transparent)`
                        : "var(--surface-sunken)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: urgente ? COR_NEG : "var(--ink)",
                        lineHeight: 1,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {dd}
                    </div>
                    <div
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: urgente ? COR_NEG : "var(--muted)",
                        marginTop: 2,
                        textTransform: "uppercase",
                      }}
                    >
                      {MESES_CURTO[mm - 1]}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "var(--ink)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {tx.descricao}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: urgente ? COR_NEG : "var(--muted)",
                        fontWeight: 600,
                        marginTop: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {rotuloPrazo}
                      <span style={{ opacity: 0.5 }}>·</span>
                      {tx.parcelas ? (
                        <span>
                          Parcela {tx.parcelas.atual}/{tx.parcelas.total}
                        </span>
                      ) : (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                          <Icon name="history" size={10} color={urgente ? COR_NEG : "var(--muted)"} strokeWidth={2.4} />
                          Mensal
                        </span>
                      )}
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
                    {fmtBRL(tx.valor, ocultar)}
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      )}

      {/* Transações recentes */}
      <div style={{ padding: "16px 20px 0" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 4px 6px",
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
            Últimos gastos
          </div>
          <button
            onClick={() => irPara("gastos")}
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
            Ver todos →
          </button>
        </div>
        <Card style={{ padding: "6px 16px" }}>
          {recentes.length === 0 && (
            <div
              style={{
                padding: 24,
                textAlign: "center",
                color: "var(--muted)",
                fontSize: 13,
              }}
            >
              Sem gastos neste mês.
            </div>
          )}
          {recentes.map((tx, i) => (
            <div
              key={tx.id}
              style={{ borderTop: i === 0 ? "none" : "1px solid var(--linha)" }}
            >
              <ItemTransacao
                tx={tx}
                ocultar={ocultar}
                onClick={() => irPara("gastos")}
              />
            </div>
          ))}
        </Card>
      </div>

      {/* Caixinhas (só aparece se houver pelo menos uma) */}
      {caixinhas && caixinhas.length > 0 && (
        <div style={{ padding: "20px 20px 0" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 4px 8px",
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
              Caixinhas
            </div>
            <button
              onClick={() => irPara("caixinhas")}
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
              Ver todas →
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {caixinhas.slice(0, 3).map((cx) => (
              <CardCaixinha
                key={cx.id}
                cx={cx}
                ocultar={ocultar}
                onClick={() => irPara("caixinha", { id: cx.id })}
              />
            ))}
          </div>
        </div>
      )}

      {simularAberto && (
        <SimularGastoModal
          restante={restante}
          orcTotal={orcTotal}
          mes={mes}
          ocultar={ocultar}
          fechar={() => setSimularAberto(false)}
        />
      )}
    </div>
  );
}
