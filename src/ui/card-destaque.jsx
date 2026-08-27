// card-destaque.jsx — o card "herói" do app. Cada tela tem no máximo um: o
// saldo do mês (Início), o orçamento mensal (Orçamentos), a projeção do ano
// (Análise) e o cabeçalho da caixinha.
//
// A receita, que antes vivia copiada nos quatro: gradiente vertical do tom
// claro no topo até o escuro na base, mais uma faixa de brilho diagonal por
// cima.
//
// As paradas são o que são por causa do TEXTO BRANCO, não por gosto. Medindo
// contraste WCAG sobre os tons do app: o corpo (--primary) dá 5,11:1 e a base
// escura dá 9,7:1. O topo claro é o ponto fraco de qualquer paleta, e por isso
// ele se dissolve cedo em vez de ocupar uma faixa larga — ver `heroDaPaleta`
// (data.js), que é quem decide as paradas.
//
// A cor é parâmetro porque a caixinha usa a dela, e não a da paleta. Quando ela
// vem, `corClara` é o miolo: a própria cor com alpha CC, que é contra o que as
// CORES_CAIXINHA foram calibradas pra dar contraste com o texto branco.
// Clarear mais que isso quebra a calibragem. Sem cor própria, nada disso
// aparece aqui: o gradiente inteiro chega pronto no token da paleta.
//
// O conteúdo já nasce dentro de um `position: relative`: a faixa de brilho é
// absoluta e, por ser posicionada, pintaria por cima de qualquer filho que não
// fosse. Quem usa não precisa mais repetir isso bloco a bloco.

// Sem cor própria, o gradiente vem pronto no token — quem o monta é
// `heroDaPaleta` (data.js), que é quem conhece as duas cores da paleta. Com cor
// própria (a caixinha), montamos aqui a mesma receita: `corClara` é a mesma cor
// com alpha, não uma segunda cor.
const HERO_DA_PALETA = "var(--primary-hero)";

function fundoProprio(cor, corClara) {
  return (
    `linear-gradient(to bottom, ${corClara} 0%, ` +
    `${cor} 45%, color-mix(in oklab, ${cor} 72%, #000) 100%)`
  );
}

// `style` sobrescreve o padrão — raio e padding variam de card pra card de
// propósito, e o do Início ainda leva uma sombra colorida.
export function CardDestaque({ cor, corClara, style = {}, children, ...rest }) {
  return (
    <div
      {...rest}
      style={{
        background: cor ? fundoProprio(cor, corClara) : HERO_DA_PALETA,
        color: "#fff",
        borderRadius: 24,
        padding: 20,
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      <div aria-hidden="true" className="card-destaque-brilho" />
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
}
