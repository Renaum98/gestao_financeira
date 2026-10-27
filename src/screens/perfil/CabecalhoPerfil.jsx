// CabecalhoPerfil.jsx — avatar, nome editável e e-mail.
// Concentra o estado da edição de nome, que só interessa aqui.

import React from "react";
import { Icon } from "../../ui/icons.jsx";
import { useT } from "../../lib/i18n.jsx";

export function CabecalhoPerfil({ preferences, setPreferences, usuario }) {
  const t = useT();
  const nomeConta = usuario?.displayName || "";
  const email = usuario?.email || "";
  // Só a foto que vem da conta (Google); o app não guarda foto própria.
  const foto = usuario?.photoURL || "";
  const nomeExibido = preferences.nome?.trim() || nomeConta || t("Você");
  const inicial = (nomeExibido.trim()[0] || "F").toUpperCase();

  const [editandoNome, setEditandoNome] = React.useState(false);
  const [nomeTemp, setNomeTemp] = React.useState(preferences.nome || nomeConta);

  const salvarNome = () => {
    setPreferences({ nome: nomeTemp.trim() });
    setEditandoNome(false);
  };

  return (
    <div style={{ padding: "0 var(--pad-x) 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: "var(--raio-pilula)",
          // A sombra neutra dos cards, não um brilho roxo: o avatar é mais uma
          // peça da tela, não um destaque.
          boxShadow: "0 1px 2px rgba(20,16,24,0.06), 0 4px 14px rgba(20,16,24,0.06)",
        }}
      >
        {foto ? (
          <img
            src={foto}
            alt=""
            referrerPolicy="no-referrer"
            style={{ width: "100%", height: "100%", borderRadius: "var(--raio-pilula)", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "var(--raio-pilula)",
              background: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 34,
              fontWeight: 800,
              letterSpacing: "-0.04em",
            }}
          >
            {inicial}
          </div>
        )}
      </div>

      {editandoNome ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
          <input
            autoFocus
            value={nomeTemp}
            onChange={(e) => setNomeTemp(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") salvarNome();
              if (e.key === "Escape") setEditandoNome(false);
            }}
            placeholder={nomeConta || t("Seu nome")}
            style={{
              padding: "8px 12px",
              borderRadius: "var(--raio-controle)",
              border: "1.5px solid var(--primary)",
              background: "var(--card)",
              fontSize: 16,
              fontWeight: 700,
              color: "var(--ink)",
              fontFamily: "inherit",
              outline: "none",
              textAlign: "center",
              width: 200,
            }}
          />
          <button
            onClick={salvarNome}
            style={{
              width: 36,
              height: 36,
              borderRadius: "var(--raio-pilula)",
              border: "none",
              cursor: "pointer",
              background: "var(--primary)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="check" size={16} strokeWidth={2.6} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => {
            setNomeTemp(preferences.nome || nomeConta);
            setEditandoNome(true);
          }}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 12,
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>
            {nomeExibido}
          </div>
          <Icon name="edit" size={14} color="var(--muted)" strokeWidth={2} />
        </button>
      )}
      {email && (
        <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500, marginTop: 4 }}>{email}</div>
      )}
    </div>
  );
}
