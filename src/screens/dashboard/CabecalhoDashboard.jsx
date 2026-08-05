// CabecalhoDashboard.jsx — saudação + ações (notificações, perfil) e o nome em
// destaque no topo da tela Início.

import { Icon } from "../../ui/icons.jsx";
import { COR_NEG } from "../../lib/colors.js";
import { useT } from "../../lib/i18n.jsx";

const ACAO_BTN = {
  width: 36,
  height: 36,
  borderRadius: 18,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  boxShadow: "0 4px 14px rgba(20,16,24,0.08), inset 0 1px 0 rgba(255,255,255,0.3)",
};

export function CabecalhoDashboard({
  saudacao,
  primeiroNome,
  irPara,
  totalNotif,
  preferences,
  usuario,
  ehDesktop,
}) {
  const t = useT();
  return (
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
            onClick={() => irPara("notificacoes")}
            className="glass-surface"
            aria-label={`${t("Notificações")}${totalNotif ? ` (${totalNotif})` : ""}`}
            style={{ ...ACAO_BTN, position: "relative" }}
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
            aria-label={t("Abrir perfil")}
            style={{ ...ACAO_BTN, padding: 0, overflow: "hidden" }}
          >
            {preferences.fotoUrl || usuario?.photoURL ? (
              <img
                src={preferences.fotoUrl || usuario.photoURL}
                alt={primeiroNome || t("Perfil")}
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
                  background: "linear-gradient(135deg, var(--primary), var(--primary-2))",
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
        {primeiroNome ? `${primeiroNome} ✦` : t("Bem-vindo ✦")}
      </div>
    </div>
  );
}
