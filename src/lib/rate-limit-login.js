// rate-limit-login.js — trava progressiva de tentativas de login.
//
// ATENÇÃO AO ALCANCE DISSO. Esta trava vive no navegador e protege contra o que
// passa pela nossa tela: alguém martelando o formulário, um script rodando na
// aba, tentativa manual de adivinhar senha. Um bot que fale direto com a API do
// Firebase Auth não vê esta tela e não é afetado — contra ele valem as defesas
// do lado do servidor (App Check e o bloqueio por IP que o próprio Firebase
// aplica, devolvendo auth/too-many-requests).
//
// O estado fica em localStorage pra sobreviver a reload da página, que é o
// contorno óbvio. Quem limpa o storage zera a contagem; de novo, é o limite de
// qualquer trava de cliente.

const CHAVE = "finca.tentativasLogin";

// Depois de LIVRES falhas seguidas, cada nova falha cai num degrau da escada.
// Os primeiros degraus são curtos pra não punir quem só errou a senha.
const LIVRES = 4;
const ESCADA_MS = [
  30 * 1000, //  5ª falha —  30 segundos
  2 * 60 * 1000, //  6ª falha —   2 minutos
  5 * 60 * 1000, //  7ª falha —   5 minutos
  15 * 60 * 1000, //  8ª falha —  15 minutos
  30 * 60 * 1000, // 9ª em diante — 30 minutos
];

// Contamos por e-mail e também no total. O contador por e-mail pega quem ataca
// uma conta; o total pega o "password spraying", que testa uma senha comum
// contra vários e-mails e nunca repete o mesmo alvo.
const CHAVE_TOTAL = "__total__";
const LIVRES_TOTAL = 12;

function ler() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE)) || {};
  } catch {
    return {};
  }
}

function gravar(dados) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(dados));
  } catch {
    /* storage cheio ou bloqueado — seguimos sem a trava */
  }
}

const normalizar = (email) => (email || "").trim().toLowerCase();

function bloqueioDe(registro, livres) {
  if (!registro) return 0;
  const passou = registro.falhas - livres;
  if (passou <= 0) return 0;
  const i = Math.min(passou - 1, ESCADA_MS.length - 1);
  return registro.ultimaFalha + ESCADA_MS[i];
}

// Quanto falta de bloqueio, em milissegundos. 0 = liberado.
export function msRestantes(email) {
  const dados = ler();
  const agora = Date.now();
  const fim = Math.max(
    bloqueioDe(dados[normalizar(email)], LIVRES),
    bloqueioDe(dados[CHAVE_TOTAL], LIVRES_TOTAL),
  );
  return Math.max(0, fim - agora);
}

// Registra uma tentativa falha e devolve quanto tempo de bloqueio ela causou.
export function registrarFalha(email) {
  const dados = ler();
  const agora = Date.now();
  for (const chave of [normalizar(email), CHAVE_TOTAL]) {
    if (!chave) continue;
    const atual = dados[chave] || { falhas: 0, ultimaFalha: 0 };
    dados[chave] = { falhas: atual.falhas + 1, ultimaFalha: agora };
  }
  gravar(dados);
  return msRestantes(email);
}

// Login deu certo: zera o contador daquele e-mail. O contador total também é
// zerado — quem provou ter a senha de uma conta não é o spraying que ele pega.
export function limparTentativas(email) {
  const dados = ler();
  delete dados[normalizar(email)];
  delete dados[CHAVE_TOTAL];
  gravar(dados);
}

// "1 min 20 s" / "45 s" — só a granularidade que importa pra espera.
export function formatarEspera(ms) {
  const seg = Math.ceil(ms / 1000);
  if (seg < 60) return `${seg}s`;
  const min = Math.floor(seg / 60);
  const resto = seg % 60;
  return resto ? `${min}min ${resto}s` : `${min}min`;
}
