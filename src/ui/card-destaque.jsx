// card-destaque.jsx — o card "herói" do app. Cada tela tem no máximo um: o
// saldo do mês (Início), o orçamento mensal (Orçamentos), a projeção do ano
// (Análise) e o cabeçalho da caixinha.
//
// A receita, que antes vivia copiada nos quatro: gradiente radial com o miolo
// claro e as quinas escuras, mais uma faixa de brilho diagonal por cima. O
// círculo não tem raio explícito, então ele vai até o canto mais distante e são
// as quinas que pegam o tom final — num card bem mais largo que alto, o escuro
// fecha forte nas laterais e só de leve em cima e embaixo.
//
// As paradas são o que são por causa do TEXTO BRANCO, não por gosto. Medindo
// contraste WCAG sobre os tons do app: o miolo (--primary-2) dá 2,88:1, o corpo
// (--primary) dá 5,11:1 e a quina dá 9,7:1. O miolo, sozinho, não alcança nem
// os 3:1 de texto grande — e antes ele era um disco CHAPADO até 18% do raio,
// bem em cima de onde o número grande de cada card fica. Por isso hoje ele é um
// ponto de luz que cai logo: a claridade continua lá, mas o texto passa a
// atravessar o corpo, e não a parte lavada.
//
// A cor é parâmetro porque a caixinha usa a dela, e não o roxo do app.
// `corClara` é o miolo: no roxo é o token --primary-2; na caixinha é a própria
// cor com alpha CC, que é contra o que as CORES_CAIXINHA foram calibradas pra
// dar contraste com o texto branco. Clarear mais que isso quebra a calibragem.
//
// O conteúdo já nasce dentro de um `position: relative`: a faixa de brilho é
// absoluta e, por ser posicionada, pintaria por cima de qualquer filho que não
// fosse. Quem usa não precisa mais repetir isso bloco a bloco.

const COR_HERO = "var(--primary)";
const COR_HERO_CLARA = "var(--primary-2)";

function fundoDestaque(cor = COR_HERO, corClara = COR_HERO_CLARA) {
  return (
    `radial-gradient(circle at 50% 28%, ${corClara} 0%, ` +
    `${cor} 50%, color-mix(in oklab, ${cor} 72%, #000) 100%)`
  );
}

// `style` sobrescreve o padrão — raio e padding variam de card pra card de
// propósito, e o do Início ainda leva uma sombra colorida.
export function CardDestaque({ cor, corClara, style = {}, children, ...rest }) {
  return (
    <div
      {...rest}
      style={{
        background: fundoDestaque(cor, corClara),
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
