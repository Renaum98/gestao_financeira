// ExcluirContaModal.jsx — exclusão permanente da conta, com reautenticação por
// senha quando o Firebase exige login recente.

import React from "react";
import { createPortal } from "react-dom";
import { Icon } from "../../ui/icons.jsx";
import { Z_MODAL } from "../../ui/modal-base.jsx";
import { reautenticarComSenha } from "../../lib/firebase.js";
import { excluirContaCompleta, precisaReautenticar } from "../../lib/account.js";
import { Loader } from "../../ui/loader.jsx";
import { COR_NEG, COR_NEG_FUNDO } from "../../lib/colors.js";
import { useT } from "../../lib/i18n.jsx";

export function ExcluirContaModal({ uid, meuEmail, meuNome, partnershipId, onFechar }) {
  const t = useT();
  // 'aviso'    → tela inicial com a confirmação textual
  // 'senha'    → pedindo senha (reautenticação)
  // 'apagando' → spinner
  const [etapa, setEtapa] = React.useState("aviso");
  const [senha, setSenha] = React.useState("");
  const [erro, setErro] = React.useState("");

  const tentarExcluir = async () => {
    setErro("");
    setEtapa("apagando");
    try {
      await excluirContaCompleta({ uid, meuEmail, meuNome, partnershipId });
      // O onAuthStateChanged dispara → o app vai pra LoginScreen sozinho.
    } catch (err) {
      if (precisaReautenticar(err)) {
        setEtapa("senha");
      } else {
        setErro(err?.message || t("Não foi possível excluir a conta."));
        setEtapa("aviso");
      }
    }
  };

  const confirmarSenha = async (e) => {
    e?.preventDefault();
    setErro("");
    if (!senha) {
      setErro(t("Digite sua senha."));
      return;
    }
    setEtapa("apagando");
    try {
      await reautenticarComSenha(senha);
      await excluirContaCompleta({ uid, meuEmail, meuNome, partnershipId });
    } catch (err) {
      const cod = err?.code;
      if (cod === "auth/wrong-password" || cod === "auth/invalid-credential") {
        setErro(t("Senha incorreta."));
      } else {
        setErro(err?.message || t("Não foi possível excluir a conta."));
      }
      setEtapa("senha");
    }
  };

  const apagando = etapa === "apagando";

  return createPortal(
    <div
      onClick={apagando ? undefined : onFechar}
      style={{
        position: "fixed",
        inset: 0,
        height: "100dvh",
        zIndex: Z_MODAL,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(20, 16, 24, 0.45)",
        backdropFilter: "blur(12px) saturate(140%)",
        WebkitBackdropFilter: "blur(12px) saturate(140%)",
        animation: "fadeIn .28s ease-out",
      }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={etapa === "senha" ? confirmarSenha : (e) => e.preventDefault()}
        role="dialog"
        aria-modal="true"
        style={{
          width: "100%",
          maxWidth: 380,
          maxHeight: "calc(100dvh - 40px)",
          overflowY: "auto",
          background: "var(--bg)",
          borderRadius: 24,
          padding: "22px 20px 18px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.28), 0 4px 12px rgba(0,0,0,0.08)",
          animation: "scaleIn .34s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            background: COR_NEG_FUNDO,
            margin: "0 auto 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="trash" size={26} color={COR_NEG} strokeWidth={2.2} />
        </div>

        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em", textAlign: "center" }}>
          {t("Excluir sua conta?")}
        </div>

        {etapa === "aviso" && (
          <>
            <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500, marginTop: 8, lineHeight: 1.45, textAlign: "center" }}>
              {t("Essa ação é ")}<strong style={{ color: "var(--ink)" }}>{t("irreversível")}</strong>{t(". Todos os seus dados (gastos, caixinhas, orçamentos, recorrentes) serão apagados permanentemente da nuvem.")}
            </div>
            {partnershipId && (
              <div
                style={{
                  marginTop: 10,
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: `color-mix(in oklab, ${COR_NEG} 8%, transparent)`,
                  fontSize: 12,
                  color: "var(--muted)",
                  fontWeight: 600,
                  lineHeight: 1.4,
                }}
              >
                {t("Você está em uma conta compartilhada — seu parceiro receberá uma notificação avisando que você saiu, e as caixinhas dele serão limpas.")}
              </div>
            )}
            {erro && (
              <div style={{ marginTop: 10, fontSize: 12.5, fontWeight: 700, color: COR_NEG, textAlign: "center" }}>
                {erro}
              </div>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button
                type="button"
                onClick={onFechar}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 14,
                  border: "none",
                  background: "var(--card-2)",
                  color: "var(--ink)",
                  fontSize: 14,
                  fontWeight: 800,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                }}
              >
                {t("Cancelar")}
              </button>
              <button
                type="button"
                onClick={tentarExcluir}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 14,
                  border: "none",
                  background: COR_NEG,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 800,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(214,58,85,0.32)",
                }}
              >
                {t("Excluir")}
              </button>
            </div>
          </>
        )}

        {etapa === "senha" && (
          <>
            <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500, marginTop: 8, lineHeight: 1.45, textAlign: "center" }}>
              {t("Por segurança, digite sua senha pra confirmar a exclusão.")}
            </div>
            <label style={{ display: "block", marginTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 6, paddingLeft: 2 }}>
                {t("Senha")}
              </div>
              <input
                autoFocus
                type="password"
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder={t("Sua senha")}
                style={{
                  width: "100%",
                  padding: "13px 14px",
                  borderRadius: 14,
                  border: "1.5px solid var(--linha)",
                  background: "var(--card)",
                  outline: "none",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--ink)",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            </label>
            {erro && (
              <div style={{ marginTop: 10, fontSize: 12.5, fontWeight: 700, color: COR_NEG, textAlign: "center" }}>
                {erro}
              </div>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button
                type="button"
                onClick={onFechar}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 14,
                  border: "none",
                  background: "var(--card-2)",
                  color: "var(--ink)",
                  fontSize: 14,
                  fontWeight: 800,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                }}
              >
                {t("Cancelar")}
              </button>
              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 14,
                  border: "none",
                  background: COR_NEG,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 800,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(214,58,85,0.32)",
                }}
              >
                {t("Confirmar exclusão")}
              </button>
            </div>
          </>
        )}

        {apagando && (
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <Loader size={44} label={t("Apagando seus dados")} />
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>{t("Apagando seus dados…")}</div>
          </div>
        )}
      </form>
    </div>,
    document.body,
  );
}
