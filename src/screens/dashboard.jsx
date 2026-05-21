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
import { ModalOverlay } from "../ui/modal-base.jsx";
import { CardCaixinha } from "./caixinhas.jsx";
import { calcularNotificacoes } from "./notificacoes.jsx";
import { dispararPendentes } from "../lib/notifications.js";
import { SimularGastoModal } from "../modals/simular-gasto.jsx";
import { vibrar } from "../lib/haptics.js";
import { COR_POS, COR_NEG, COR_AVISO } from "../lib/colors.js";
import { computeInsights } from "../lib/insights.jsx";
import { obterOrcBaseDoMes, mesCorrente } from "../lib/orcamento.js";

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
    marcarTxPago,
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
  // Mês passado: usa o snapshot de orçamento congelado (preferences.orcBaseAt).
  // Mês atual: usa o orçamento atual normalmente. Isso garante que alterações
  // de orçamento hoje não retroajam ao "Restante" de meses anteriores.
  const orcBase = obterOrcBaseDoMes(mes, preferences, mesCorrente());
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
      if (t.pago) return false;
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

  // Conta selecionada em "Próximas a vencer" — exibe modal pra marcar como paga.
  const [contaSelecionada, setContaSelecionada] = React.useState(null);

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

  // Renderiza o card de saldo para um mês qualquer. Usado uma vez no desktop
  // e várias vezes no carrossel mobile (uma por mês em `todosMeses`).
  // Recalcula os valores agregados para `mesCard` em vez de reutilizar os do
  // mês ativo — o custo é baixo (soma sobre as txs do mês) e simplifica a
  // lógica: cada slide é auto-contido.
  const renderCardSaldo = (mesCard) => {
    const idxC = todosMeses.indexOf(mesCard);
    const mesAntC = idxC >= 0 && idxC < todosMeses.length - 1 ? todosMeses[idxC + 1] : null;
    const txMesC = txDoMes(txs, mesCard);
    const txMesAntC = mesAntC ? txDoMes(txs, mesAntC) : [];
    const totalC = totalGeral(txMesC);
    const totalAntC = totalGeral(txMesAntC);
    const entradasC = totalEntradas(txMesC);
    const deltaC = totalAntC > 0 ? ((totalC - totalAntC) / totalAntC) * 100 : 0;
    const orcBaseC = obterOrcBaseDoMes(mesCard, preferences, mesCorrente());

    let gMeu = 0;
    let gPar = 0;
    for (const c of caixinhas || []) {
      for (const d of c.depositos || []) {
        if (!d.data || !d.data.startsWith(mesCard)) continue;
        if (!(d.valor > 0)) continue;
        const dono = d.feitoPor || meuUid || "_anon";
        if (dono === (meuUid || "_anon")) gMeu += d.valor;
        else if (partnerUid && dono === partnerUid) gPar += d.valor;
      }
    }
    const orcTotalC = orcBaseC + entradasC - gMeu;
    const restanteC = orcTotalC - totalC;

    const parceiroDoMesC = txDoMes(partnerTxs, mesCard);
    const totalParceiroC = totalGeral(parceiroDoMesC);
    const entradasParC = totalEntradas(parceiroDoMesC);
    const orcTotalParceiroC = orcBaseParceiro + entradasParC - gPar;
    const restanteParceiroC = orcTotalParceiroC - totalParceiroC;
    const disponivelConjuntoC = restanteC + restanteParceiroC;
    const temEntradaC = entradasC > 0;

    return (
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
          boxShadow: "0 4px 12px color-mix(in oklab, var(--primary) 10%, transparent)",
        }}
      >
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
            Gasto em {rotuloMes(mesCard)}
          </div>
          <SeletorMes mes={mesCard} setMes={setMes} todosMeses={todosMeses} />
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
          {fmtBRL(totalC, ocultar)}
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
          {totalAntC > 0 && (
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
              <span>{deltaC >= 0 ? "▲" : "▼"}</span>
              <span>{Math.abs(deltaC).toFixed(1)}%</span>
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
              {fmtBRL(orcTotalC, ocultar)}
            </div>
            {temEntradaC && (
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  opacity: 0.85,
                  marginTop: 2,
                }}
              >
                +{fmtBRL(entradasC, ocultar)} entradas
              </div>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 600 }}>
              {restanteC >= 0 ? "Restante" : "Acima do orçamento"}
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                marginTop: 2,
                color: restanteC >= 0 ? "#D9F5C8" : "#FFD0D9",
              }}
            >
              {fmtBRL(Math.abs(restanteC), ocultar)}
            </div>
          </div>
        </div>

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
              <span>{partnerNome || "Parceiro"}</span>
              <span style={{ opacity: 0.85 }}>
                {fmtBRLCompacto(totalParceiroC, ocultar)} gasto
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
              <span>Orçamento {fmtBRLCompacto(orcTotalParceiroC, ocultar)}</span>
              <span
                style={{
                  color: restanteParceiroC >= 0 ? "#D9F5C8" : "#FFD0D9",
                  fontWeight: 700,
                }}
              >
                {restanteParceiroC >= 0 ? "Resta " : "Acima "}
                {fmtBRLCompacto(Math.abs(restanteParceiroC), ocultar)}
              </span>
            </div>

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
                  color: disponivelConjuntoC >= 0 ? "#D9F5C8" : "#FFD0D9",
                  letterSpacing: "-0.01em",
                }}
              >
                {fmtBRL(Math.abs(disponivelConjuntoC), ocultar)}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

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
              aria-label={ocultar ? "Mostrar valores" : "Ocultar valores"}
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
              aria-label="Abrir perfil"
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

      {/* Card principal — saldo do mês.
          Mobile: carrossel horizontal com um slide por mês, swipe troca o mês ativo.
          Desktop: card único do mês selecionado. */}
      {ehDesktop ? (
        <div className="col-span-all" style={{ padding: "4px 20px 0" }}>
          {renderCardSaldo(mes)}
        </div>
      ) : (
        <CarrosselSaldoMes
          todosMeses={todosMeses}
          mes={mes}
          setMes={setMes}
          renderCard={renderCardSaldo}
        />
      )}

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
            border: "1px solid color-mix(in oklab, var(--primary) 35%, transparent)",
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
                  onClick={() => { vibrar(); setContaSelecionada(tx); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 0",
                    borderTop: i === 0 ? "none" : "1px solid var(--linha)",
                    cursor: "pointer",
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

      {contaSelecionada && (
        <ContaProximaModal
          tx={contaSelecionada}
          ocultar={ocultar}
          onFechar={() => setContaSelecionada(null)}
          onMarcarPago={() => {
            marcarTxPago(contaSelecionada.id);
            setContaSelecionada(null);
          }}
        />
      )}
    </div>
  );
}

function ContaProximaModal({ tx, ocultar, onFechar, onMarcarPago }) {
  const [, mm, dd] = tx.data.split("-").map(Number);
  const cat = CATEGORIAS[tx.categoria] || CATEGORIAS.outros;
  const diasAte = Math.ceil(
    (new Date(tx.data + "T12:00:00") - new Date()) / (1000 * 60 * 60 * 24),
  );
  const rotuloPrazo =
    diasAte <= 0 ? "Vence hoje"
      : diasAte === 1 ? "Vence amanhã"
        : `Vence em ${diasAte} dias`;

  return (
    <ModalOverlay
      onClose={onFechar}
      maxWidth={380}
      scrollable={false}
      center
      borderRadius={24}
      padding="22px 22px 18px"
    >
      <div style={{
        width: 56, height: 56, borderRadius: 28,
        background: "color-mix(in oklab, var(--primary) 14%, transparent)",
        margin: "0 auto 14px",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon name="calendar" size={26} color="var(--primary)" strokeWidth={2.2} />
      </div>

      <div style={{ fontSize: 17, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>
        {tx.descricao}
      </div>
      <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600, marginTop: 4 }}>
        {dd}/{String(mm).padStart(2, "0")} · {cat.nome}
      </div>

      <div style={{
        marginTop: 14, padding: "12px 14px", borderRadius: 14,
        background: "var(--card-2)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.4 }}>
            Valor
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", marginTop: 2 }}>
            {fmtBRL(tx.valor, ocultar)}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.4 }}>
            Prazo
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginTop: 2 }}>
            {rotuloPrazo}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
        <button onClick={onFechar} style={{
          flex: 1, padding: "12px", borderRadius: 14, border: "none",
          background: "var(--card-2)", color: "var(--ink)",
          fontSize: 14, fontWeight: 800, fontFamily: "inherit", cursor: "pointer",
          boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
        }}>Fechar</button>
        <button onClick={onMarcarPago} style={{
          flex: 1, padding: "12px", borderRadius: 14, border: "none",
          background: COR_POS, color: "#fff",
          fontSize: 14, fontWeight: 800, fontFamily: "inherit", cursor: "pointer",
          boxShadow: "0 4px 14px color-mix(in oklab, " + COR_POS + " 32%, transparent)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          <Icon name="check" size={16} color="#fff" strokeWidth={2.6} />
          Marcar como pago
        </button>
      </div>
    </ModalOverlay>
  );
}

// Carrossel horizontal do card principal no mobile. Cada slide é o card
// renderizado para um mês diferente; swipe lateral troca o mês ativo via
// `setMes`. Ordem ascendente (mais antigo à esquerda) — swipe pra direita
// volta no tempo, swipe pra esquerda avança. Quando `mes` muda por fora
// (ex: SeletorMes dentro do card), o carrossel rola para o slide certo.
//
// Os slides laterais ficam progressivamente diminuídos/esmaecidos conforme
// a distância do centro do viewport, dando sensação de profundidade. O
// efeito é dirigido pelo scroll em tempo real via rAF — sem transição CSS,
// pra acompanhar o gesto sem lag.
function CarrosselSaldoMes({ todosMeses, mes, setMes, renderCard }) {
  const ref = React.useRef(null);
  const slideRefs = React.useRef([]);
  const mesesAsc = React.useMemo(() => [...todosMeses].reverse(), [todosMeses]);
  const idxAtivo = Math.max(0, mesesAsc.indexOf(mes));
  // Evita feedback loop: enquanto o scroll programático está rolando, não
  // chamamos setMes a partir do onScroll.
  const rolandoProgRef = React.useRef(false);
  const ultimoMesEnviado = React.useRef(mes);
  const primeiraVezRef = React.useRef(true);
  const rafRef = React.useRef(0);
  // Marca que a próxima mudança de idxAtivo veio do próprio swipe do usuário —
  // nesse caso o scroll-snap nativo já está centralizando, então o layoutEffect
  // NÃO deve disparar um scrollTo programático (que brigaria com o dedo).
  const mudouPorSwipeRef = React.useRef(false);

  const aplicarEfeitos = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const centro = el.scrollLeft + el.clientWidth / 2;
    for (const s of slideRefs.current) {
      if (!s) continue;
      const sc = s.offsetLeft + s.clientWidth / 2;
      // distância normalizada: 0 = centralizado, 1 = totalmente deslocado
      const d = Math.min(1, Math.abs(sc - centro) / s.clientWidth);
      const op = 1 - d * 0.45;     // até 0.55 de opacidade nos extremos
      const scale = 1 - d * 0.14;  // scale-down até 14% nos slides laterais
      s.style.opacity = op.toFixed(3);
      s.style.transform = `scale(${scale.toFixed(3)})`;
    }
  }, []);

  // Centraliza o slide ativo. Em primeiro render usa "auto" pra evitar flash;
  // depois usa "smooth" pra acompanhar mudanças via SeletorMes.
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Mudança disparada pelo swipe do usuário: o snap nativo já centraliza.
    // Só atualizamos os efeitos e saímos, sem scrollTo programático.
    if (mudouPorSwipeRef.current) {
      mudouPorSwipeRef.current = false;
      primeiraVezRef.current = false;
      aplicarEfeitos();
      return;
    }
    const slide = slideRefs.current[idxAtivo];
    if (!slide) return;
    const alvo = slide.offsetLeft - (el.clientWidth - slide.clientWidth) / 2;
    if (Math.abs(el.scrollLeft - alvo) >= 2) {
      rolandoProgRef.current = true;
      el.scrollTo({ left: alvo, behavior: primeiraVezRef.current ? "auto" : "smooth" });
      primeiraVezRef.current = false;
      const t = setTimeout(() => {
        rolandoProgRef.current = false;
        aplicarEfeitos();
      }, 500);
      aplicarEfeitos();
      return () => clearTimeout(t);
    }
    primeiraVezRef.current = false;
    aplicarEfeitos();
  }, [idxAtivo, aplicarEfeitos]);

  const onScroll = React.useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      aplicarEfeitos();
      if (rolandoProgRef.current) return;
      const el = ref.current;
      if (!el) return;
      const centro = el.scrollLeft + el.clientWidth / 2;
      let maisPerto = idxAtivo;
      let menorDist = Infinity;
      slideRefs.current.forEach((c, i) => {
        if (!c) return;
        const cc = c.offsetLeft + c.clientWidth / 2;
        const d = Math.abs(cc - centro);
        if (d < menorDist) {
          menorDist = d;
          maisPerto = i;
        }
      });
      const novo = mesesAsc[maisPerto];
      if (novo && novo !== ultimoMesEnviado.current) {
        ultimoMesEnviado.current = novo;
        mudouPorSwipeRef.current = true;
        setMes(novo);
      }
    });
  }, [mesesAsc, setMes, idxAtivo, aplicarEfeitos]);

  React.useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div
      ref={ref}
      onScroll={onScroll}
      className="carrossel-saldo"
      style={{
        display: "flex",
        justifyContent: "safe center",
        overflowX: "auto",
        overflowY: "hidden",
        scrollSnapType: "x mandatory",
        // smooth aplica-se a scrolls programáticos (scrollTo) — usado quando
        // SeletorMes muda o mês por fora do swipe.
        scrollBehavior: "smooth",
        WebkitOverflowScrolling: "touch",
        overscrollBehaviorX: "contain",
        // padding lateral = (viewport - slide_width) / 2, sintonizado com o
        // flex-basis abaixo (100vw - 56) → 28px de cada lado pra permitir que
        // o primeiro/último slide consigam ser centralizados pelo snap.
        padding: "4px 28px 0",
        gap: 12,
      }}
    >
      {mesesAsc.map((m, i) => (
        <div
          key={m}
          ref={(node) => {
            slideRefs.current[i] = node;
          }}
          style={{
            flex: "0 0 calc(100vw - 56px)",
            scrollSnapAlign: "center",
            // sem scrollSnapStop: "always" — permite gestos rápidos
            // atravessarem mais de um slide sem travar
            willChange: "opacity, transform",
            transformOrigin: "center center",
            // Sem transition: opacity/transform são reescritos a cada frame de
            // scroll por aplicarEfeitos (via rAF), então o efeito acompanha o
            // dedo 1:1. Uma transition aqui só adicionaria lag perseguindo o
            // gesto. O snap nativo continua emitindo scroll até assentar, então
            // o estado final também fica suave sem transição.
            backfaceVisibility: "hidden",
          }}
        >
          {renderCard(m)}
        </div>
      ))}
    </div>
  );
}
