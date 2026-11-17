// voltar.js — liga o "voltar" do sistema (botão/gesto do Android, gesto da
// borda no iPhone, voltar do navegador) à navegação caseira do app
// (irPara/voltar em app.jsx, sem router).
//
// Sem isto o histórico do navegador tem uma entrada só: o voltar do Android
// não tinha pra onde ir e fechava o app de dentro de qualquer subpágina.
//
// O modelo é uma GUARDA: enquanto houver algo a desfazer (modal aberto,
// subpágina empilhada, aba que não é o Início), mantemos UMA entrada extra no
// histórico. O voltar do sistema consome essa entrada (popstate), o app desfaz
// um passo e, se ainda sobrar algo a desfazer, a guarda volta. Na raiz não há
// guarda, e o próximo voltar sai do app, como o Android espera.
//
// Uma guarda só, e não uma entrada por tela, porque a pilha do app muda por
// caminhos que não passam pelo histórico (aba trocada na tab bar zera a pilha,
// o botão de voltar da TopBar desempilha). Espelhar tudo isso entrada por
// entrada desalinharia na primeira divergência; com uma guarda só, cada voltar
// do sistema é sempre "desfaça um passo", seja qual for a pilha.
//
// AVANÇAR não existe no app. Mas a guarda consumida por um voltar continua no
// histórico como entrada "pra frente", e no iPhone o arraste da borda direita
// é o avançar do Safari: ele caía nela e disparava o mesmo popstate de um
// voltar. Por isso cada guarda leva um número crescente (`n`): popstate que
// chega numa entrada de número maior que o da atual é um avançar, e é anulado.

let guardada = false; // estamos parados numa guarda?
let ignorarPop = false; // o próximo popstate fomos nós que pedimos (desarmar)
let aoVoltar = null; // desfaz um passo no app
let precisa = () => false; // há algo a desfazer agora?
let seq = 0; // último número dado a uma guarda
let pos = 0; // número da entrada em que estamos (0 = entrada sem guarda)

const numeroDe = (state) => (state && state.guardaVoltar ? state.n || 0 : 0);

function armar() {
  if (guardada) return;
  seq = Math.max(seq, pos) + 1;
  window.history.pushState({ guardaVoltar: true, n: seq }, '');
  pos = seq;
  guardada = true;
}

function desarmar() {
  if (!guardada) return;
  guardada = false;
  ignorarPop = true;
  window.history.back();
}

// Confere a guarda contra o estado atual: põe se falta, tira se sobra. O app
// chama depois de cada render que pode ter mudado a resposta de `precisa`.
export function sincronizarVoltar() {
  if (precisa()) armar();
  else desarmar();
}

// O app registra uma vez: `deveGuardar` diz se há algo a desfazer e
// `desfazer` desfaz um passo. Os dois devem ler o estado mais recente (refs),
// porque o listener vive mais que um render.
export function registrarVoltar({ deveGuardar, desfazer }) {
  precisa = deveGuardar;
  aoVoltar = desfazer;
  // Recarregou a página parado numa guarda: ela continua lá, e é nossa. Se
  // ninguém a reconhecer, ela vira um voltar que não faz nada.
  const estado = window.history.state;
  pos = numeroDe(estado);
  seq = Math.max(seq, pos);
  if (estado?.guardaVoltar) guardada = true;

  const aoPop = () => {
    const estadoNovo = window.history.state;
    const n = numeroDe(estadoNovo);
    const avancou = n > pos;
    pos = n;
    // Onde paramos pode ser outra guarda (uma velha que ficou no caminho).
    guardada = Boolean(estadoNovo?.guardaVoltar);

    if (ignorarPop) {
      ignorarPop = false;
      // Entre o pedido de desarmar e este pop o app pode ter voltado a
      // precisar da guarda (saiu da raiz de novo).
      sincronizarVoltar();
      return;
    }
    if (avancou) {
      // Avançar (borda direita no iPhone): o app não muda. Se ainda há o que
      // desfazer, ficar parado nesta guarda é exatamente o certo; se não há,
      // desarmar devolve o histórico pra entrada de baixo.
      sincronizarVoltar();
      return;
    }
    aoVoltar?.();
    // Quem desfez mudou estado do React: o efeito do app chama
    // sincronizarVoltar depois do render. Se nada mudou (nada a desfazer), a
    // guarda não volta e o próximo voltar sai do app.
  };
  window.addEventListener('popstate', aoPop);
  return () => {
    window.removeEventListener('popstate', aoPop);
    precisa = () => false;
    aoVoltar = null;
  };
}
