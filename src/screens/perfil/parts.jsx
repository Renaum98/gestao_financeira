// parts.jsx — controles pequenos reusados na tela de Perfil.

import React from "react";
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
