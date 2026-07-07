// SecaoTitulo.jsx — título padrão das seções da Análise.


export function SecaoTitulo({ children }) {
  return (
    <div
      style={{
        fontSize: 15,
        fontWeight: 700,
        color: "var(--ink)",
        padding: "0 4px 8px",
      }}
    >
      {children}
    </div>
  );
}
