// DesempenhoCard.jsx — o seletor do modo leve.
//
// Fica separado do AparenciaCard de propósito: o que está aqui não é gosto, é
// troca. Cada coisa que o modo leve desliga tem um preço, e a linha de baixo
// existe pra dizer qual é antes de a pessoa ligar — quem escolhe o modo leve
// precisa saber que vai perder o swipe entre meses, não descobrir depois.

import { Card } from "../../ui/common.jsx";
import { Segmentado } from "./parts.jsx";
import { useT } from "../../lib/i18n.jsx";
import { AUTO, LIGADO, DESLIGADO, aparelhoModesto, ehLeve } from "../../lib/leve.js";

export function DesempenhoCard({ preferences, setPreferences }) {
  const t = useT();
  const escolha = preferences.leve || AUTO;
  const ativo = ehLeve(escolha);

  // No automático vale dizer o que ele decidiu: sem isso o usuário vê "vidro
  // sim" num aparelho e "vidro não" no outro sem entender o que mudou.
  const explicacao =
    escolha === AUTO
      ? aparelhoModesto
        ? t("Ligado: este aparelho foi detectado como mais modesto.")
        : t("Desligado: este aparelho dá conta dos efeitos completos.")
      : ativo
        ? t("Menos efeitos, mais fluidez. Sem vidro, sem animações de transição e sem deslizar entre meses no card de saldo.")
        : t("Todos os efeitos ligados.");

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
        {t("Desempenho")}
      </div>
      <div style={{ padding: "8px 0 4px" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>
          {t("Modo leve")}
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: "var(--muted)",
            fontWeight: 500,
            lineHeight: 1.45,
            marginBottom: 10,
          }}
        >
          {t("Deixa o app mais ágil em celulares menos potentes, abrindo mão de efeitos visuais.")}
        </div>
        <Segmentado
          ariaLabel={t("Modo leve")}
          valor={escolha}
          onChange={(id) => setPreferences({ leve: id })}
          opcoes={[
            { id: AUTO, label: t("Automático") },
            { id: LIGADO, label: t("Ligado") },
            { id: DESLIGADO, label: t("Desligado") },
          ]}
        />
        <div
          style={{
            fontSize: 12,
            color: "var(--muted)",
            fontWeight: 500,
            lineHeight: 1.45,
            marginTop: 10,
          }}
        >
          {explicacao}
        </div>
      </div>
    </Card>
  );
}
