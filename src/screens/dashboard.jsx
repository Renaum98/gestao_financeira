// dashboard.jsx — Tela Início (visão geral do mês).
// Orquestra os blocos da tela; cada bloco vive em ./dashboard/*.

import React from "react";
import { CATEGORIAS, MESES, chaveMes, totalPorCategoria } from "../data.js";
import { Icon } from "../ui/icons.jsx";
import { calcularNotificacoes } from "./notificacoes.jsx";
import { dispararPendentes } from "../lib/notifications.js";
import { SimularGastoModal } from "../modals/simular-gasto.jsx";
import { vibrar } from "../lib/haptics.js";
import { useT } from "../lib/i18n.jsx";
import { computeInsights } from "../lib/insights.jsx";
import { calcularSaldoMes } from "../lib/saldo-mes.js";
import { mesAnteriorDe } from "../lib/orcamento.js";
import { DiferencaMesModal } from "./dashboard/DiferencaMesModal.jsx";
import { CabecalhoDashboard } from "./dashboard/CabecalhoDashboard.jsx";
import { CardSaldo } from "./dashboard/CardSaldo.jsx";
import { CarrosselSaldoMes } from "./dashboard/CarrosselSaldoMes.jsx";
import { InsightsCard } from "./dashboard/InsightsCard.jsx";
import { ProximasVencer } from "./dashboard/ProximasVencer.jsx";
import { UltimosGastos } from "./dashboard/UltimosGastos.jsx";
import { CaixinhasPreview } from "./dashboard/CaixinhasPreview.jsx";
import { ContaProximaModal } from "./dashboard/ContaProximaModal.jsx";

export function DashboardScreen({ ctx }) {
  const {
    txs,
    mes,
    setMes,
    todosMeses,
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
    partnerNome = "",
    partnerOrcamentos = {},
    partnerOrcamentoMensal = 0,
    partnerUid,
    setPreferences,
    pronto,
  } = ctx;
  const t = useT();

  const notifInfo = React.useMemo(
    () =>
      calcularNotificacoes(
        txs,
        recorrentes,
        preferences?.notifLidas || [],
        convitesRecebidos,
        notificacoesParceria,
        orcamentos,
      ),
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
      t,
    });
  }, [notifInfo, preferences?.notifLidas, t]);

  const primeiroNome = (preferences.nome?.trim() || usuario?.displayName || "")
    .trim()
    .split(" ")[0];
  const hojeHora = new Date().getHours();
  const saudacao = hojeHora < 12 ? t("Bom dia") : hojeHora < 18 ? t("Boa tarde") : t("Boa noite");

  const meuUid = usuario?.uid;
  const ehCompartilhado = !!partnerUid;
  const somaOrcCatsParceiro = Object.values(partnerOrcamentos).reduce((s, v) => s + v, 0);
  const orcBaseParceiro = partnerOrcamentoMensal > 0 ? partnerOrcamentoMensal : somaOrcCatsParceiro;

  // Agregados do mês ativo — mesma conta dos cards, reusada aqui pra insights e
  // pelo modal de simulação.
  const saldo = React.useMemo(
    () =>
      calcularSaldoMes(mes, {
        txs,
        partnerTxs,
        todosMeses,
        preferences,
        caixinhas,
        meuUid,
        partnerUid,
        orcBaseParceiro,
      }),
    [mes, txs, partnerTxs, todosMeses, preferences, caixinhas, meuUid, partnerUid, orcBaseParceiro],
  );
  const { txMes, txMesAnt, total, totalAnt, entradas, delta, orcTotal, restante } = saldo;

  // ─── Modal de virada de mês (diferença do mês anterior) ───
  // No primeiro acesso de um mês novo, oferece trazer o que sobrou/faltou no
  // mês anterior pro mês atual. A resposta (valor ou 0) fica gravada em
  // preferences.carryover[mesAtual] — a presença da chave marca "já perguntei".
  const mesReal = React.useMemo(() => chaveMes(new Date()), []);
  const mesRealAnt = React.useMemo(() => mesAnteriorDe(mesReal), [mesReal]);
  const saldoMesAnt = React.useMemo(
    () =>
      calcularSaldoMes(mesRealAnt, {
        txs,
        partnerTxs,
        todosMeses,
        preferences,
        caixinhas,
        meuUid,
        partnerUid,
        orcBaseParceiro,
      }),
    [mesRealAnt, txs, partnerTxs, todosMeses, preferences, caixinhas, meuUid, partnerUid, orcBaseParceiro],
  );
  const [diferencaModal, setDiferencaModal] = React.useState(null);
  React.useEffect(() => {
    if (!pronto || !preferences) return;
    // Já respondido pra este mês? (chave presente, mesmo que 0).
    if (preferences.carryover && mesReal in preferences.carryover) return;
    // Só oferece se o mês anterior teve uso real e uma diferença relevante.
    if (saldoMesAnt.txMes.length === 0) return;
    if (Math.abs(saldoMesAnt.restante) < 0.01) return;
    setDiferencaModal({ mes: mesRealAnt, valor: saldoMesAnt.restante });
  }, [pronto, preferences, mesReal, mesRealAnt, saldoMesAnt]);

  const responderDiferenca = (trazer) => {
    if (!diferencaModal) return;
    const valor = trazer ? diferencaModal.valor : 0;
    setPreferences({
      carryover: { ...(preferences?.carryover || {}), [mesReal]: valor },
    });
    setDiferencaModal(null);
  };
  const nomeMesAntModal = diferencaModal
    ? t(MESES[Number(diferencaModal.mes.split("-")[1]) - 1])
    : "";

  // No Dashboard, "Últimos gastos" mostra somente OS MEUS — txs do parceiro
  // ficam na aba de Transações (por opção de UX: o resumo aqui é pessoal).
  const recentes = txMes.slice(0, 3);

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

  // Top categorias com orçamento estourando ou perto do limite.
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

  // Insights textuais — lógica pura em lib/insights.jsx, aqui só memoizamos.
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
        t,
      }),
    [txMes, txMesAnt, total, totalAnt, delta, ocultar, mes, orcTotal, restante, entradas, caixinhas, proximas, orcCategorias, t],
  );

  const [simularAberto, setSimularAberto] = React.useState(false);
  const [contaSelecionada, setContaSelecionada] = React.useState(null);

  const renderCardSaldo = (mesCard) => (
    <CardSaldo
      mesCard={mesCard}
      todosMeses={todosMeses}
      txs={txs}
      partnerTxs={partnerTxs}
      preferences={preferences}
      caixinhas={caixinhas}
      meuUid={meuUid}
      partnerUid={partnerUid}
      orcBaseParceiro={orcBaseParceiro}
      setMes={setMes}
      ocultar={ocultar}
      ehCompartilhado={ehCompartilhado}
      partnerNome={partnerNome}
    />
  );

  return (
    <div className={ehDesktop ? "cols-desktop" : undefined} style={{ paddingBottom: "var(--pad-bottom)" }}>
      <CabecalhoDashboard
        saudacao={saudacao}
        primeiroNome={primeiroNome}
        ocultar={ocultar}
        setOcultar={setOcultar}
        irPara={irPara}
        totalNotif={totalNotif}
        preferences={preferences}
        usuario={usuario}
        ehDesktop={ehDesktop}
      />

      {/* Card principal — saldo do mês.
          Mobile: carrossel horizontal com um slide por mês, swipe troca o ativo.
          Desktop: card único do mês selecionado. */}
      {ehDesktop ? (
        <div className="col-span-all" style={{ padding: "4px 20px 0" }}>
          {renderCardSaldo(mes)}
        </div>
      ) : (
        <CarrosselSaldoMes todosMeses={todosMeses} mes={mes} setMes={setMes} renderCard={renderCardSaldo} />
      )}

      <InsightsCard insights={insights} ehDesktop={ehDesktop} />

      {/* Botão discreto: simular um gasto e checar se cabe no orçamento */}
      <div className={ehDesktop ? "col-span-all" : undefined} style={{ padding: "10px 20px 0" }}>
        <button
          onClick={() => {
            vibrar();
            setSimularAberto(true);
          }}
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
          {t("Simular um gasto")}
        </button>
      </div>

      <ProximasVencer
        proximas={proximas}
        ocultar={ocultar}
        irPara={irPara}
        onSelecionar={setContaSelecionada}
        ehDesktop={ehDesktop}
      />

      <UltimosGastos recentes={recentes} ocultar={ocultar} irPara={irPara} />

      <CaixinhasPreview caixinhas={caixinhas} ocultar={ocultar} irPara={irPara} />

      {simularAberto && (
        <SimularGastoModal
          restante={restante}
          orcTotal={orcTotal}
          mes={mes}
          ocultar={ocultar}
          fechar={() => setSimularAberto(false)}
        />
      )}

      {diferencaModal && (
        <DiferencaMesModal
          nomeMesAnt={nomeMesAntModal}
          valor={diferencaModal.valor}
          ocultar={ocultar}
          onTrazer={() => responderDiferenca(true)}
          onIgnorar={() => responderDiferenca(false)}
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
