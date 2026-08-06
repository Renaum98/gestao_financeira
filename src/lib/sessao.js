// sessao.js — lembra se a última visita terminou com alguém logado.
//
// O Firebase restaura a sessão do IndexedDB de forma assíncrona: nos primeiros
// quadros da abertura o app ainda não sabe se tem usuário. Não dá pra esperar
// em silêncio — alguma coisa precisa estar na tela — e a tela certa depende
// justamente da resposta que ainda não chegou.
//
// Este palpite desfaz o impasse: gravamos o resultado de cada resolução do auth
// e, na abertura seguinte, apostamos nele. É palpite mesmo — uma sessão que
// expirou entre uma visita e outra faz o splash aparecer antes do login —, e
// por isso ele não libera nada: quem decide o que o app mostra continua sendo o
// auth. Aqui só se escolhe o que preencher a espera.

const CHAVE = "tinha-sessao";

export function haviaSessao() {
  try {
    return localStorage.getItem(CHAVE) === "1";
  } catch {
    return false; // localStorage indisponível (modo privado) — assume deslogado
  }
}

export function lembrarSessao(tem) {
  try {
    if (tem) localStorage.setItem(CHAVE, "1");
    else localStorage.removeItem(CHAVE);
  } catch {
    /* localStorage indisponível (modo privado) — ignora */
  }
}
