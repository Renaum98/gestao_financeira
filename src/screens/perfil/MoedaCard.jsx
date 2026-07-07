// MoedaCard.jsx — escolha da moeda de exibição (símbolo/formato, sem conversão).

import { Card } from "../../ui/common.jsx";
import { useT } from "../../lib/i18n.jsx";
import { MOEDAS, MOEDAS_SUPORTADAS } from "../../lib/moeda.js";
import { SelectPerfil } from "./parts.jsx";

export function MoedaCard({ preferences, setPreferences }) {
  const t = useT();
  const atual = preferences.moeda || "BRL";
  const options = MOEDAS_SUPORTADAS.map((cod) => {
    const m = MOEDAS[cod];
    return { value: cod, label: `${m.codigo} ${m.simbolo} · ${t(m.nome)}` };
  });
  return (
    <Card style={{ padding: 16 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "var(--muted)",
          textTransform: "uppercase",
          letterSpacing: 0.4,
          paddingBottom: 4,
        }}
      >
        {t("Moeda")}
      </div>
      <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500, paddingBottom: 12, lineHeight: 1.4 }}>
        {t("Muda apenas o símbolo e o formato — sem conversão de câmbio.")}
      </div>
      <SelectPerfil
        value={atual}
        onChange={(moeda) => setPreferences({ moeda })}
        options={options}
        ariaLabel={t("Moeda")}
      />
    </Card>
  );
}
