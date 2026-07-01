// ConvidarParceiroModal.jsx — fluxo de convite de parceiro: explicação →
// e-mail → sucesso.

import React from "react";
import { createPortal } from "react-dom";
import { Icon } from "../../ui/icons.jsx";
import { Z_MODAL } from "../../ui/modal-base.jsx";
import { vibrar } from "../../lib/haptics.js";
import { convidarPorEmail } from "../../lib/partnership.js";
import { COR_POS, COR_NEG } from "../../lib/colors.js";
import { useT } from "../../lib/i18n.jsx";

function ExplicacaoConta({ onContinuar, onCancelar }) {
  const t = useT();
  const itens = [
    { icon: "eye", texto: t("Vocês veem os gastos um do outro (sem editar).") },
    { icon: "piggy", texto: t("Caixinhas viram compartilhadas — ambos editam.") },
    { icon: "close", texto: t("Dá pra desfazer; quem desfaz leva as caixinhas.") },
  ];
  return (
    <div>
      <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500, lineHeight: 1.45, marginBottom: 12 }}>
        {t("Pensada pra ")}<strong style={{ color: "var(--ink)" }}>{t("dois usuários")}</strong>{t(" (ex: casal) acompanharem os gastos um do outro e juntarem dinheiro pra metas comuns.")}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {itens.map((it, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px",
              background: "var(--card-2)",
              borderRadius: 10,
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 8,
                background: "color-mix(in oklab, var(--primary) 14%, transparent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon name={it.icon} size={13} color="var(--primary)" strokeWidth={2.4} />
            </div>
            <div style={{ fontSize: 12.5, color: "var(--ink)", fontWeight: 600, lineHeight: 1.35 }}>
              {it.texto}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 10,
          fontSize: 11.5,
          color: "var(--muted)",
          fontWeight: 600,
          lineHeight: 1.4,
          textAlign: "center",
          padding: "0 4px",
        }}
      >
        {t("Só entre ")}<strong style={{ color: "var(--ink)" }}>{t("2 pessoas")}</strong>{t(". Pra trocar, desfaça a parceria atual antes.")}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button
          type="button"
          onClick={onCancelar}
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
          onClick={onContinuar}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 14,
            border: "none",
            background: "linear-gradient(135deg, var(--primary), var(--primary-2))",
            color: "#fff",
            fontSize: 14,
            fontWeight: 800,
            fontFamily: "inherit",
            cursor: "pointer",
            boxShadow: "0 4px 14px color-mix(in oklab, var(--primary) 32%, transparent)",
          }}
        >
          {t("Continuar")}
        </button>
      </div>
    </div>
  );
}

export function ConvidarParceiroModal({ meuUid, meuNome, meuEmail, onFechar }) {
  const t = useT();
  const [etapa, setEtapa] = React.useState("explicacao"); // 'explicacao' | 'email' | 'sucesso'
  const [email, setEmail] = React.useState("");
  const [erro, setErro] = React.useState("");
  const [enviando, setEnviando] = React.useState(false);
  const sucesso = etapa === "sucesso";

  const enviar = async (e) => {
    e?.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      await convidarPorEmail({ meuUid, meuNome, meuEmail, emailParceiro: email });
      vibrar(14);
      setEtapa("sucesso");
      setTimeout(onFechar, 1400);
    } catch (err) {
      setErro(err?.message || t("Não foi possível enviar o convite."));
      setEnviando(false);
    }
  };

  return createPortal(
    <div
      onClick={enviando ? undefined : onFechar}
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
        onSubmit={enviar}
        role="dialog"
        aria-modal="true"
        style={{
          width: "100%",
          maxWidth: 400,
          maxHeight: "calc(100dvh - 40px)",
          overflowY: "auto",
          background: "var(--bg)",
          borderRadius: 24,
          padding: "20px 18px 16px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.28), 0 4px 12px rgba(0,0,0,0.08)",
          animation: "scaleIn .34s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              background: "linear-gradient(135deg, var(--primary), var(--primary-2))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon name="user" size={20} color="#fff" strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>
              {etapa === "explicacao" ? t("Conta compartilhada") : t("Convidar parceiro")}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, marginTop: 2 }}>
              {etapa === "explicacao"
                ? t("Entenda como funciona antes de convidar.")
                : t("Ele(a) precisa já ter conta no app.")}
            </div>
          </div>
        </div>

        {etapa === "explicacao" ? (
          <ExplicacaoConta onContinuar={() => setEtapa("email")} onCancelar={onFechar} />
        ) : sucesso ? (
          <div
            style={{
              padding: "20px 16px",
              textAlign: "center",
              background: `color-mix(in oklab, ${COR_POS} 10%, transparent)`,
              border: `1px solid color-mix(in oklab, ${COR_POS} 25%, transparent)`,
              borderRadius: 14,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 800, color: COR_POS }}>{t("Convite enviado!")}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, marginTop: 4 }}>
              {t("Aguarde a resposta nas notificações.")}
            </div>
          </div>
        ) : (
          <>
            <label style={{ display: "block" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 6, paddingLeft: 2 }}>
                {t("E-mail do parceiro")}
              </div>
              <input
                autoFocus
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="parceiro@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={enviando}
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
              <div style={{ marginTop: 10, fontSize: 12.5, fontWeight: 700, color: COR_NEG }}>{erro}</div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button
                type="button"
                onClick={onFechar}
                disabled={enviando}
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
                  cursor: enviando ? "default" : "pointer",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                  opacity: enviando ? 0.6 : 1,
                }}
              >
                {t("Cancelar")}
              </button>
              <button
                type="submit"
                disabled={enviando || !email.trim()}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 14,
                  border: "none",
                  background:
                    enviando || !email.trim()
                      ? "var(--linha)"
                      : "linear-gradient(135deg, var(--primary), var(--primary-2))",
                  color: enviando || !email.trim() ? "var(--muted)" : "#fff",
                  fontSize: 14,
                  fontWeight: 800,
                  fontFamily: "inherit",
                  cursor: enviando || !email.trim() ? "default" : "pointer",
                  boxShadow:
                    enviando || !email.trim()
                      ? "none"
                      : "0 4px 14px color-mix(in oklab, var(--primary) 32%, transparent)",
                }}
              >
                {enviando ? t("Enviando…") : t("Enviar convite")}
              </button>
            </div>
          </>
        )}
      </form>
    </div>,
    document.body,
  );
}
