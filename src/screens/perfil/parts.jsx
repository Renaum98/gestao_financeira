// parts.jsx — controles pequenos reusados na tela de Perfil.

import { Icon } from "../../ui/icons.jsx";
import { vibrar } from "../../lib/haptics.js";

export function Toggle({ ativo, onChange }) {
  return (
    <div
      onClick={() => {
        vibrar();
        onChange(!ativo);
      }}
      style={{
        width: 42,
        height: 26,
        borderRadius: 14,
        background: ativo ? "var(--primary)" : "var(--surface-sunken)",
        position: "relative",
        cursor: "pointer",
        transition: "background .15s",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 2,
          left: ativo ? 18 : 2,
          width: 22,
          height: 22,
          borderRadius: 11,
          background: "#fff",
          transition: "left .15s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        }}
      />
    </div>
  );
}

// Controle segmentado — as opções lado a lado, uma acesa. Usado pelo Tema e
// pelo Modo leve; nasceu dentro do AparenciaCard e saiu de lá quando o segundo
// apareceu, pra os dois não divergirem de aparência com o tempo.
export function Segmentado({ valor, onChange, opcoes, ariaLabel }) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      style={{
        display: "flex",
        gap: 6,
        padding: 4,
        borderRadius: 12,
        background: "var(--card-2)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
      }}
    >
      {opcoes.map((opt) => {
        const sel = valor === opt.id;
        return (
          <button
            key={opt.id}
            role="radio"
            aria-checked={sel}
            onClick={() => {
              vibrar();
              onChange(opt.id);
            }}
            style={{
              flex: 1,
              padding: "8px 8px",
              borderRadius: 10,
              border: "none",
              background: sel ? "var(--card)" : "transparent",
              color: sel ? "var(--ink)" : "var(--muted)",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: sel ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
              transition: "background .15s",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// Select padronizado da tela de Perfil (idioma, moeda). Native <select> com
// aparência custom + chevron, pra ficar consistente entre os cards.
export function SelectPerfil({ value, onChange, options, ariaLabel }) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => {
          vibrar();
          onChange(e.target.value);
        }}
        style={{
          width: "100%",
          appearance: "none",
          WebkitAppearance: "none",
          MozAppearance: "none",
          padding: "12px 40px 12px 14px",
          borderRadius: 12,
          border: "none",
          background: "var(--card-2)",
          color: "var(--ink)",
          fontSize: 14,
          fontWeight: 700,
          fontFamily: "inherit",
          cursor: "pointer",
          outline: "none",
          boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <div
        style={{
          position: "absolute",
          right: 14,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          display: "flex",
        }}
      >
        <Icon name="chevron-down" size={16} color="var(--muted)" strokeWidth={2.2} />
      </div>
    </div>
  );
}

export function ConfigItem({ icon, label, onClick, toggleAtivo, onToggle }) {
  return (
    <div
      onClick={onClick}
      className="config-item"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 0",
        borderTop: "1px solid var(--linha)",
        cursor: onClick || onToggle ? "pointer" : "default",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          background: "var(--bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={icon} size={18} color="var(--ink)" strokeWidth={2} />
      </div>
      <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{label}</div>
      {onToggle ? (
        <Toggle ativo={toggleAtivo} onChange={onToggle} />
      ) : (
        <Icon name="chevron-right" size={16} color="var(--muted)" strokeWidth={2} />
      )}
    </div>
  );
}
