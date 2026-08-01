// conexao.js — estado de conexão do aparelho.
//
// Por que isso existe: as coleções (txs, caixinhas, recorrentes…) são campos de
// array em users/{uid}, e cada escrita manda o array inteiro. O Firestore tem
// cache persistente, então um aparelho offline enfileira a escrita e a envia ao
// reconectar — com o array como ele o conhecia. Como o conflito é resolvido por
// campo, esse array velho sobrescreve o do servidor e apaga o que outro
// aparelho gravou no meio tempo. A regra do app é a nuvem sempre prevalecer,
// então enquanto não há conexão o app simplesmente não escreve.
//
// A checagem é feita na hora da ação, não guardada em estado: o que importa é a
// conexão no instante em que a escrita aconteceria.

// `navigator.onLine === false` é confiável na direção que importa: quando o
// navegador afirma que está offline, está mesmo. O contrário (dizer online sem
// internet de verdade) não bloqueia nada — é o comportamento que já tínhamos.
export function estaOffline() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}
