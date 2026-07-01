// CabecalhoPerfil.jsx — avatar (troca/remove foto), nome editável e e-mail.
// Concentra o estado da foto e da edição de nome, que só interessam aqui.

import React from "react";
import { Icon } from "../../ui/icons.jsx";
import { vibrar } from "../../lib/haptics.js";
import { lerFotoPerfil } from "../../lib/imagem.js";
import { COR_NEG } from "../../lib/colors.js";
import { useT } from "../../lib/i18n.jsx";

export function CabecalhoPerfil({ preferences, setPreferences, usuario }) {
  const t = useT();
  const nomeConta = usuario?.displayName || "";
  const email = usuario?.email || "";
  const foto = preferences.fotoUrl || usuario?.photoURL || "";
  const nomeExibido = preferences.nome?.trim() || nomeConta || t("Você");
  const inicial = (nomeExibido.trim()[0] || "F").toUpperCase();

  const [editandoNome, setEditandoNome] = React.useState(false);
  const [nomeTemp, setNomeTemp] = React.useState(preferences.nome || nomeConta);
  const [erroFoto, setErroFoto] = React.useState("");
  const [carregandoFoto, setCarregandoFoto] = React.useState(false);
  const inputFotoRef = React.useRef(null);

  const salvarNome = () => {
    setPreferences({ nome: nomeTemp.trim() });
    setEditandoNome(false);
  };

  const escolherFoto = () => {
    setErroFoto("");
    inputFotoRef.current?.click();
  };
  const aoSelecionarFoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite re-selecionar o mesmo arquivo depois
    if (!file) return;
    setErroFoto("");
    setCarregandoFoto(true);
    try {
      const dataUrl = await lerFotoPerfil(file);
      setPreferences({ fotoUrl: dataUrl });
      vibrar(14);
    } catch (err) {
      setErroFoto(err?.message || t("Não foi possível usar essa imagem."));
    }
    setCarregandoFoto(false);
  };
  const removerFoto = () => {
    setErroFoto("");
    setPreferences({ fotoUrl: "" });
    vibrar();
  };

  return (
    <div style={{ padding: "0 20px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Avatar — clique para trocar a foto */}
      <input ref={inputFotoRef} type="file" accept="image/*" onChange={aoSelecionarFoto} style={{ display: "none" }} />
      <button
        onClick={escolherFoto}
        aria-label={t("Alterar foto de perfil")}
        style={{
          position: "relative",
          width: 88,
          height: 88,
          borderRadius: 44,
          border: "none",
          padding: 0,
          cursor: "pointer",
          background: "transparent",
          boxShadow: "0 12px 30px color-mix(in oklab, var(--primary) 22%, transparent)",
          opacity: carregandoFoto ? 0.6 : 1,
        }}
      >
        {foto ? (
          <img
            src={foto}
            alt=""
            referrerPolicy="no-referrer"
            style={{ width: "100%", height: "100%", borderRadius: 44, objectFit: "cover", display: "block" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 44,
              background: "linear-gradient(135deg, var(--primary), var(--primary-2))",
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
        {/* Selo de câmera */}
        <div
          className="glass-surface"
          style={{
            position: "absolute",
            right: -2,
            bottom: -2,
            width: 30,
            height: 30,
            borderRadius: 15,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
          }}
        >
          <Icon name="edit" size={14} color="var(--ink)" strokeWidth={2.2} />
        </div>
      </button>
      {foto && preferences.fotoUrl ? (
        <button
          onClick={removerFoto}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            marginTop: 8,
            color: "var(--muted)",
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "inherit",
          }}
        >
          {t("Remover foto")}
        </button>
      ) : null}
      {erroFoto && (
        <div style={{ fontSize: 12, fontWeight: 700, color: COR_NEG, marginTop: 6, textAlign: "center" }}>
          {erroFoto}
        </div>
      )}

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
              borderRadius: 12,
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
              borderRadius: 18,
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
