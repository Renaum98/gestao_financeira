// AtalhoOrcamentos.jsx — cartão-atalho para a tela de orçamentos.

import { Icon } from "../../ui/icons.jsx";
import { Card } from "../../ui/common.jsx";
import { useT } from "../../lib/i18n.jsx";

export function AtalhoOrcamentos({ irPara, spanAll }) {
  const t = useT();
  return (
    <div className={spanAll} style={{ padding: "16px 20px 0" }}>
      <Card
        onClick={() => irPara("orcamentos")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          background: "linear-gradient(135deg, #FFF3E2, #FFE0EC)",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="target" size={22} color="var(--primary)" strokeWidth={2.2} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1416" }}>
            {t("Acompanhar orçamentos")}
          </div>
          <div style={{ fontSize: 12, color: "#6B5560", fontWeight: 600, marginTop: 2 }}>
            {t("Veja onde está perto do limite")}
          </div>
        </div>
        <Icon name="chevron-right" size={18} color="#1A1416" strokeWidth={2.4} />
      </Card>
    </div>
  );
}
