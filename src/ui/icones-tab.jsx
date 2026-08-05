// icones-tab.jsx — os ícones da tab bar
//
// Separados de propósito do Icon genérico (icons.jsx): sem rótulo embaixo, o
// ícone da barra carrega a identificação da aba sozinho, e ganha uma animação
// própria ao virar a aba ativa. Cada animação mexe nas PARTES do desenho (o
// telhado, cada linha, cada barra), então cada parte precisa de classe própria —
// peso que não faz sentido carregar nas dezenas de telas que usam o Icon.
//
// O movimento em si mora na CSS (components.css, bloco "Ícones da tab bar").

// Comprimento do traço, em unidades do viewBox, pra a animação de "desenhar"
// (stroke-dashoffset). Fica junto do `d` que o define: mexeu no caminho, o
// número novo está na mesma linha.
const traco = (n) => ({ "--traco": n });

export function IconeTab({ name, size = 24, color = "currentColor", strokeWidth = 2 }) {
  const props = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    // sem overflow: o corte na borda do viewBox é de propósito — é o que faz os
    // ombros do "perfil" parecerem entrar por baixo do desenho
    style: { width: size, height: size, display: "block" },
  };

  switch (name) {
    // O telhado cai sobre a casa e a parede cede no impacto.
    case "home":
      return (
        <svg {...props}>
          <path className="nav-ico-telhado" d="M3 11l9-8 9 8" />
          <path className="nav-ico-parede" d="M5 9.5V21h14V9.5" />
        </svg>
      );

    // As três linhas se escrevem da esquerda pra direita, em cascata.
    case "list":
      return (
        <svg {...props}>
          <path className="nav-ico-linha nav-ico-linha-1" style={traco(16)} d="M4 6h16" />
          <path className="nav-ico-linha nav-ico-linha-2" style={traco(16)} d="M4 12h16" />
          <path className="nav-ico-linha nav-ico-linha-3" style={traco(16)} d="M4 18h16" />
        </svg>
      );

    // As barras sobem da base — cada `d` começa embaixo, então o traço se
    // desenha de baixo pra cima sozinho, sem precisar de escala nem de origem.
    case "chart":
      return (
        <svg {...props}>
          <path className="nav-ico-base" d="M22 20H2" />
          <path className="nav-ico-barra nav-ico-barra-1" style={traco(10)} d="M4 20V10" />
          <path className="nav-ico-barra nav-ico-barra-2" style={traco(16)} d="M10 20V4" />
          <path className="nav-ico-barra nav-ico-barra-3" style={traco(7)} d="M16 20v-7" />
        </svg>
      );

    // A cabeça surge e os ombros sobem logo atrás.
    case "user":
      return (
        <svg {...props}>
          <circle className="nav-ico-cabeca" cx="12" cy="8" r="4" />
          <path className="nav-ico-ombros" d="M4 21c1-4 4-6 8-6s7 2 8 6" />
        </svg>
      );

    default:
      return null;
  }
}
