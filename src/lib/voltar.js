// voltar.js — liga o "voltar" do sistema (botão/gesto do Android, voltar do
// navegador) à navegação caseira do app (irPara/voltar em app.jsx, sem router).
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

let guardada = false; // a guarda está no topo do histórico?
let ignorarPop = false; // o próximo popstate fomos nós que pedimos (desarmar)
let aoVoltar = null; // desfaz um passo no app
let precisa = () => false; // há algo a desfazer agora?

const MARCA = { guardaVoltar: true };

function armar() {
  if (guardada) return;
  window.history.pushState(MARCA, '');
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
  // Recarregou a página com a guarda no topo: ela continua lá, e é nossa. Se
  // ninguém a reconhecer, ela vira um voltar que não faz nada.
  if (window.history.state?.guardaVoltar) guardada = true;
  const aoPop = () => {
    // A guarda saiu do topo, seja por nós (desarmar) ou pelo usuário.
    guardada = false;
    if (ignorarPop) {
      ignorarPop = false;
      // Entre o pedido de desarmar e este pop o app pode ter voltado a
      // precisar da guarda (saiu da raiz de novo).
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
