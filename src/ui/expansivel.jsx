// expansivel.jsx — bloco que abre e fecha em altura, sem salto.
//
// O truque (0fr → 1fr no grid) e as transições vivem em styles/components.css,
// em `.expansivel`. Aqui só o estado.
//
// O conteúdo fica MONTADO quando fechado — animar altura exige que o navegador
// saiba o tamanho de destino. Pra o que está escondido não continuar alcançável
// pelo Tab e pelo leitor de tela, o CSS aplica `visibility: hidden` no fim do
// fechamento (atrasado, senão o conteúdo sumiria antes de a altura chegar a
// zero).
//
// Consequência pra quem usa: o conteúdo precisa continuar renderizável enquanto
// o bloco fecha. Quando ele vem de um valor que some (um aviso que virou null),
// segure o último valor com `useUltimoNaoNulo` — senão o colapso anima uma
// caixa vazia.

import React from "react";

export function Expansivel({ aberto, children, style }) {
  return (
    <div
      className="expansivel"
      data-aberto={aberto ? "true" : "false"}
      style={{ gridTemplateRows: aberto ? "1fr" : "0fr", ...style }}
      aria-hidden={aberto ? undefined : true}
    >
      <div>
        <div className="expansivel-conteudo" style={{ opacity: aberto ? 1 : 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// Devolve o último valor não-nulo — o conteúdo do bloco sobrevive ao instante em
// que a condição que o criou vira null, que é justamente quando ele começa a
// fechar. Escrever na ref durante o render é seguro aqui: é cache, não efeito.
export function useUltimoNaoNulo(valor) {
  const ultimo = React.useRef(valor);
  if (valor != null) ultimo.current = valor;
  return valor != null ? valor : ultimo.current;
}
