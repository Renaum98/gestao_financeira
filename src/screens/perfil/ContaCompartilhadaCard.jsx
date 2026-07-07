// ContaCompartilhadaCard.jsx — estado da parceria: conectado, convite pendente
// ou convite ainda não enviado.

import { Icon } from "../../ui/icons.jsx";
import { Card } from "../../ui/common.jsx";
import { COR_NEG } from "../../lib/colors.js";
import { useT } from "../../lib/i18n.jsx";

export function ContaCompartilhadaCard({
  partnerUid,
  partnerNome,
  convitePendente,
  onConvidar,
  onCancelarConvite,
  onDesfazer,
}) {
  const t = useT();
  const conectado = !!partnerUid;
  const inicialParceiro = (partnerNome?.trim()[0] || "?").toUpperCase();

  return (
    <Card style={{ padding: 16 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "var(--muted)",
          textTransform: "uppercase",
          letterSpacing: 0.4,
          paddingBottom: 12,
        }}
      >
        {t("Conta compartilhada")}
      </div>

      {conectado ? (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                background: "linear-gradient(135deg, var(--primary), var(--primary-2))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                flexShrink: 0,
              }}
            >
              {inicialParceiro}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>
                {t("Conectado com {nome}", { nome: partnerNome || t("seu parceiro") })}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500, marginTop: 2 }}>
                {t("Vocês visualizam os gastos um do outro. Caixinhas são compartilhadas.")}
              </div>
            </div>
          </div>
          <button
            onClick={onDesfazer}
            style={{
              marginTop: 14,
              padding: "9px 14px",
              borderRadius: 12,
              border: "1.5px solid var(--linha)",
              background: "var(--card)",
              color: COR_NEG,
              fontSize: 13,
              fontWeight: 800,
              fontFamily: "inherit",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon name="close" size={14} color={COR_NEG} strokeWidth={2.4} />
            {t("Desfazer parceria")}
          </button>
        </div>
      ) : convitePendente ? (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>
            {t("Convite enviado para {nome}", { nome: convitePendente.toNome || convitePendente.toUid })}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500, marginBottom: 12 }}>
            {t("Aguardando aceite. Você pode cancelar enquanto não houver resposta.")}
          </div>
          <button
            onClick={() => onCancelarConvite(convitePendente.id)}
            style={{
              padding: "8px 14px",
              borderRadius: 12,
              border: "1.5px solid var(--linha)",
              background: "var(--card)",
              color: COR_NEG,
              fontSize: 13,
              fontWeight: 800,
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            {t("Cancelar convite")}
          </button>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500, lineHeight: 1.45, marginBottom: 12 }}>
            {t("Convide seu parceiro pra que vocês vejam os gastos um do outro e dividam caixinhas.")}
          </div>
          <button
            onClick={onConvidar}
            style={{
              padding: "10px 16px",
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg, var(--primary), var(--primary-2))",
              color: "#fff",
              fontSize: 13,
              fontWeight: 800,
              fontFamily: "inherit",
              cursor: "pointer",
              boxShadow: "0 4px 12px color-mix(in oklab, var(--primary) 28%, transparent)",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Icon name="plus" size={14} color="#fff" strokeWidth={2.6} />
            {t("Convidar parceiro")}
          </button>
        </div>
      )}
    </Card>
  );
}
