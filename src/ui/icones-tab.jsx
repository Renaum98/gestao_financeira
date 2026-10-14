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

    // Os cinco abaixo só aparecem na sidebar do desktop — a tab bar não tem
    // essas abas. Mesmo desenho do Icon, partes separadas pra animar.

    // Orçamentos — os anéis do alvo se desenham de fora pra dentro e o centro
    // acende com um repique, como um tiro na mosca.
    case "target":
      return (
        <svg {...props}>
          <circle className="nav-ico-anel nav-ico-anel-1" style={traco(57)} cx="12" cy="12" r="9" />
          <circle className="nav-ico-anel nav-ico-anel-2" style={traco(32)} cx="12" cy="12" r="5" />
          <circle className="nav-ico-mosca" cx="12" cy="12" r="1.5" fill={color} />
        </svg>
      );

    // Caixinhas — a alça se fecha por cima, a caixa assenta com o peso e a
    // fenda se risca.
    case "piggy":
      return (
        <svg {...props}>
          <path className="nav-ico-alca" style={traco(14)} d="M9 8V6a3 3 0 016 0v2" />
          <rect className="nav-ico-caixa" x="3" y="8" width="18" height="12" rx="3" />
          <path className="nav-ico-fenda" style={traco(4)} d="M10 13h4" />
        </svg>
      );

    // Cartões — o cartão entra deslizando, como passando na maquininha, e a
    // tarja se risca atrás dele.
    case "card":
      return (
        <svg {...props}>
          <g className="nav-ico-cartao">
            <rect x="2.5" y="6" width="19" height="13" rx="2.5" />
            <path className="nav-ico-tarja" style={traco(19)} d="M2.5 10.5h19" />
          </g>
        </svg>
      );

    // Recorrentes — a volta se desenha, a ponta da seta fecha o giro e os
    // ponteiros acertam a hora.
    case "history":
      return (
        <svg {...props}>
          <path className="nav-ico-volta" style={traco(51)} d="M3 12a9 9 0 109-9 9 9 0 00-7 3" />
          <path className="nav-ico-seta" d="M3 4v5h5" />
          <path className="nav-ico-ponteiros" d="M12 7v5l3 2" />
        </svg>
      );

    // Histórico — as argolas caem no lugar, uma depois da outra, e a linha do
    // cabeçalho se risca.
    case "calendar":
      return (
        <svg {...props}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path className="nav-ico-cabecalho" style={traco(18)} d="M3 10h18" />
          <path className="nav-ico-argola nav-ico-argola-1" d="M8 3v4" />
          <path className="nav-ico-argola nav-ico-argola-2" d="M16 3v4" />
        </svg>
      );

    default:
      return null;
  }
}
