// AparenciaCard.jsx — escolha de tema (sistema/claro/escuro) e cor de destaque.

import { PALETAS, coresDaPaleta } from "../../data.js";
import { Card } from "../../ui/common.jsx";
import { Segmentado } from "./parts.jsx";
import { vibrar } from "../../lib/haptics.js";
import { useTemaEscuro } from "../../lib/tema.js";
import { useT } from "../../lib/i18n.jsx";

export function AparenciaCard({ preferences, setPreferences }) {
  const t = useT();
  // A bolinha tem que mostrar a cor que a paleta vai render AGORA: no escuro a
  // "Preto" vira prata, e desenhá-la preta seria uma bolinha invisível em cima
  // de um card escuro, prometendo uma cor que o app não aplica.
  const escuro = useTemaEscuro(preferences.modo);
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
        {t("Aparência")}
      </div>
      <div style={{ padding: "8px 0 4px" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 10 }}>{t("Tema")}</div>
        <Segmentado
          ariaLabel={t("Tema")}
          valor={preferences.modo || "sistema"}
          onChange={(id) => setPreferences({ modo: id })}
          opcoes={[
            { id: "sistema", label: t("Sistema") },
            { id: "claro", label: t("Claro") },
            { id: "escuro", label: t("Escuro") },
          ]}
        />
      </div>
      <div style={{ padding: "12px 0 4px" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 10 }}>
          {t("Cor de destaque")}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {PALETAS.map((p) => {
            // p.primary continua sendo a identidade da paleta (é o que fica
            // salvo em preferences.paleta); só a pintura muda com o tema.
            const sel = preferences.paleta === p.primary;
            const cor = coresDaPaleta(p, escuro);
            return (
              <button
                key={p.primary}
                onClick={() => {
                  vibrar();
                  setPreferences({ paleta: p.primary });
                }}
                title={p.nome}
                className={`swatch-raised${sel ? " is-selected" : ""}`}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  background: `linear-gradient(135deg, ${cor.primary}, ${cor.primary2})`,
                  color: cor.primary,
                }}
              />
            );
          })}
        </div>
      </div>
    </Card>
  );
}
