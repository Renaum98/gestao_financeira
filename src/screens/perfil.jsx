// perfil.jsx — Tela Perfil (conta, aparência, atalhos, sair). Orquestra os
// blocos; cada um vive em ./perfil/*.

import React from "react";
import { Icon } from "../ui/icons.jsx";
import { Card, TopBar } from "../ui/common.jsx";
import { ConfirmModal } from "../ui/confirm-modal.jsx";
import { vibrar } from "../lib/haptics.js";
import { useT } from "../lib/i18n.jsx";
import { baixarDadosXLSX } from "../lib/export.js";
import { cancelarConvite } from "../lib/partnership.js";
import { COR_NEG } from "../lib/colors.js";
import { ConfigItem } from "./perfil/parts.jsx";
import { CabecalhoPerfil } from "./perfil/CabecalhoPerfil.jsx";
import { IdiomaCard } from "./perfil/IdiomaCard.jsx";
import { MoedaCard } from "./perfil/MoedaCard.jsx";
import { AparenciaCard } from "./perfil/AparenciaCard.jsx";
import { ContaCompartilhadaCard } from "./perfil/ContaCompartilhadaCard.jsx";
import { ConvidarParceiroModal } from "./perfil/ConvidarParceiroModal.jsx";
import { ExcluirContaModal } from "./perfil/ExcluirContaModal.jsx";
import { BaixarDadosModal } from "./perfil/BaixarDadosModal.jsx";

export function PerfilScreen({ ctx }) {
  const {
    voltar, ocultar, setOcultar, irPara, setOnboarding,
    preferences, setPreferences, usuario, sair, ehDesktop,
    txs, caixinhas, recorrentes, orcamentos, todosMeses,
    partnerUid, partnerNome, convitesEnviados, desfazerParceria,
    partnershipId,
  } = ctx;
  const t = useT();
  const nomeConta = usuario?.displayName || "";

  const [confirmarSair, setConfirmarSair] = React.useState(false);
  const [baixar, setBaixar] = React.useState(null); // null | { mes: 'todos' | 'YYYY-MM', baixando, erro }
  const [convidando, setConvidando] = React.useState(false);
  const [confirmandoDesfazer, setConfirmandoDesfazer] = React.useState(false);
  const [desfazendo, setDesfazendo] = React.useState(false);
  const [excluindoConta, setExcluindoConta] = React.useState(false);

  const abrirBaixar = () => {
    vibrar();
    setBaixar({ mes: "todos", baixando: false, erro: "" });
  };
  const executarBaixar = async () => {
    if (!baixar) return;
    setBaixar((b) => ({ ...b, baixando: true, erro: "" }));
    try {
      await baixarDadosXLSX({
        txs, caixinhas, recorrentes, orcamentos,
        mes: baixar.mes === "todos" ? null : baixar.mes,
        nomeUsuario: preferences.nome || nomeConta,
      });
      vibrar(14);
      setBaixar(null);
    } catch (err) {
      setBaixar((b) => ({ ...b, baixando: false, erro: t("Não foi possível gerar o arquivo.") }));
    }
  };

  return (
    <div style={{ paddingBottom: "var(--pad-bottom)" }}>
      <TopBar voltar={ehDesktop ? undefined : voltar} />

      <CabecalhoPerfil preferences={preferences} setPreferences={setPreferences} usuario={usuario} />

      <div style={{ padding: "24px 20px 0" }}>
        <AparenciaCard preferences={preferences} setPreferences={setPreferences} />

        <div style={{ height: 14 }} />
        <ContaCompartilhadaCard
          partnerUid={partnerUid}
          partnerNome={partnerNome}
          convitePendente={(convitesEnviados || []).find((c) => c.status === "pendente")}
          onConvidar={() => {
            vibrar();
            setConvidando(true);
          }}
          onCancelarConvite={async (id) => {
            try {
              await cancelarConvite(id);
              vibrar();
            } catch { }
          }}
          onDesfazer={() => {
            vibrar();
            setConfirmandoDesfazer(true);
          }}
        />

        <div style={{ height: 14 }} />
        <Card style={{ padding: "4px 16px" }}>
          <ConfigItem icon="piggy" label={t("Caixinhas")} onClick={() => irPara("caixinhas")} />
          <ConfigItem icon="target" label={t("Orçamentos")} onClick={() => irPara("orcamentos")} />
          <ConfigItem icon="history" label={t("Recorrentes")} onClick={() => irPara("recorrentes")} />
          <ConfigItem icon="calendar" label={t("Histórico")} onClick={() => irPara("historico")} />
          <ConfigItem
            icon={ocultar ? "eye-off" : "eye"}
            label={t("Modo privacidade")}
            toggleAtivo={ocultar}
            onToggle={() => setOcultar(!ocultar)}
          />
        </Card>

        <div style={{ height: 14 }} />
        <Card style={{ padding: "4px 16px" }}>
          <ConfigItem icon="sparkle" label={t("Refazer tour")} onClick={() => setOnboarding(true)} />
          <ConfigItem icon="list" label={t("Baixar dados (.xlsx)")} onClick={abrirBaixar} />
        </Card>

        <div style={{ height: 14 }} />
        <IdiomaCard preferences={preferences} setPreferences={setPreferences} />

        <div style={{ height: 14 }} />
        <MoedaCard preferences={preferences} setPreferences={setPreferences} />

        <div style={{ height: 18 }} />
        <button
          onClick={() => setConfirmarSair(true)}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 16,
            border: "none",
            background: "var(--card)",
            color: COR_NEG,
            fontSize: 14,
            fontWeight: 800,
            cursor: "pointer",
            fontFamily: "inherit",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COR_NEG} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <path d="M16 17l5-5-5-5M21 12H9" />
          </svg>
          {t("Sair da conta")}
        </button>

        <button
          onClick={() => setExcluindoConta(true)}
          style={{
            width: "100%",
            marginTop: 10,
            padding: "12px",
            borderRadius: 14,
            border: "none",
            background: "transparent",
            color: "var(--muted)",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Icon name="trash" size={13} color="var(--muted)" strokeWidth={2.2} />
          {t("Excluir conta permanentemente")}
        </button>

        <div style={{ padding: "24px 0", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>MyCounts · v1.0</div>
        </div>
      </div>

      {confirmarSair && (
        <ConfirmModal
          titulo={t("Sair da conta?")}
          mensagem={t("Você precisará entrar novamente com seu e-mail e senha. Os dados continuam salvos na nuvem.")}
          textoConfirmar={t("Sair")}
          icone="close"
          onCancelar={() => setConfirmarSair(false)}
          onConfirmar={() => {
            setConfirmarSair(false);
            sair();
          }}
        />
      )}

      {confirmandoDesfazer && (
        <ConfirmModal
          titulo={t("Desfazer conta compartilhada?")}
          mensagem={t("Vocês deixarão de ver os gastos um do outro. As caixinhas ficarão com você ({nome} perde acesso).", { nome: partnerNome || t("seu parceiro") })}
          textoConfirmar={desfazendo ? t("Desfazendo…") : t("Desfazer")}
          icone="close"
          onCancelar={() => {
            if (!desfazendo) setConfirmandoDesfazer(false);
          }}
          onConfirmar={async () => {
            if (desfazendo) return;
            setDesfazendo(true);
            try {
              await desfazerParceria();
              setConfirmandoDesfazer(false);
            } catch (err) {
              console.error(err);
            }
            setDesfazendo(false);
          }}
        />
      )}

      {excluindoConta && (
        <ExcluirContaModal
          uid={usuario?.uid}
          meuEmail={usuario?.email || ""}
          meuNome={preferences.nome || usuario?.displayName || ""}
          partnershipId={partnershipId}
          onFechar={() => setExcluindoConta(false)}
        />
      )}

      {convidando && (
        <ConvidarParceiroModal
          meuUid={usuario?.uid}
          meuNome={preferences.nome || usuario?.displayName || ""}
          meuEmail={usuario?.email || ""}
          onFechar={() => setConvidando(false)}
        />
      )}

      {baixar && (
        <BaixarDadosModal
          mesSelecionado={baixar.mes}
          onSelecionarMes={(m) => setBaixar((b) => ({ ...b, mes: m }))}
          baixando={baixar.baixando}
          erro={baixar.erro}
          todosMeses={todosMeses}
          onCancelar={() => setBaixar(null)}
          onConfirmar={executarBaixar}
        />
      )}
    </div>
  );
}
