// IdiomaCard.jsx — escolha do idioma do app (Português / Inglês).

import React from "react";
import { Card } from "../../ui/common.jsx";
import { useT } from "../../lib/i18n.jsx";
import { SelectPerfil } from "./parts.jsx";

const IDIOMAS = [
  { value: "pt", label: "Português" },
  { value: "en", label: "English" },
];

export function IdiomaCard({ preferences, setPreferences }) {
  const t = useT();
  const atual = preferences.idioma || "pt";
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
        {t("Idioma")}
      </div>
      <SelectPerfil
        value={atual}
        onChange={(idioma) => setPreferences({ idioma })}
        options={IDIOMAS}
        ariaLabel={t("Idioma")}
      />
    </Card>
  );
}
