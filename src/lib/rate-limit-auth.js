// rate-limit-auth.js — trava progressiva das ações de autenticação.
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
//
// São três ações, e elas não se parecem:
//
//   login      — o risco é adivinhar senha, então só a falha conta. Errar a
//                própria senha é comum, e os primeiros degraus são curtos.
//   cadastro   — o risco é criar contas em massa, e aí o *sucesso* é o que
//                queremos limitar: cada envio conta, tenha dado certo ou não.
//   recuperar  — o risco é usar o app pra encher a caixa de entrada de alguém.
//                Também conta todo envio.

const CHAVE = "finca.tentativasAuth";
// Nome anterior, quando isso só cobria o login. Limpo na primeira leitura pra
// não deixar lixo permanente no storage de quem já usava o app.
const CHAVE_ANTIGA = "finca.tentativasLogin";

export const ACAO_LOGIN = "login";
export const ACAO_CADASTRO = "cadastro";
export const ACAO_RECUPERAR = "recuperar";

// Escada de espera: depois das tentativas livres, cada nova cai num degrau.
const ESCADA_LOGIN = [
  30 * 1000, //  1º excedente —  30 segundos
  2 * 60 * 1000, //  2º —   2 minutos
  5 * 60 * 1000, //  3º —   5 minutos
  15 * 60 * 1000, //  4º —  15 minutos
  30 * 60 * 1000, //  5º em diante — 30 minutos
];

// Criar conta e pedir link de senha são ações raras — quem faz de verdade faz
// uma vez. Então a escada começa mais alta e sobe mais rápido que a do login.
const ESCADA_ENVIO = [
  60 * 1000, //  1º excedente —  1 minuto
  5 * 60 * 1000, //  2º —  5 minutos
  15 * 60 * 1000, //  3º — 15 minutos
  60 * 60 * 1000, //  4º em diante — 1 hora
];

// `livres` conta por e-mail e pega quem insiste no mesmo alvo. `livresTotal`
// conta tudo junto e pega quem troca de alvo a cada tentativa — o "password
// spraying" no login, a criação em série de contas no cadastro.
const REGRAS = {
  [ACAO_LOGIN]: { livres: 4, livresTotal: 12, escada: ESCADA_LOGIN },
  [ACAO_CADASTRO]: { livres: 2, livresTotal: 4, escada: ESCADA_ENVIO },
  [ACAO_RECUPERAR]: { livres: 2, livresTotal: 6, escada: ESCADA_ENVIO },
};

const CHAVE_TOTAL = "__total__";

function ler() {
  try {
    localStorage.removeItem(CHAVE_ANTIGA);
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

// As contagens são separadas por ação: estourar o cadastro não pode travar o
// login de quem já tem conta.
const chaveEmail = (acao, email) => `${acao}:${normalizar(email)}`;
const chaveTotal = (acao) => `${acao}:${CHAVE_TOTAL}`;

function bloqueioDe(registro, livres, escada) {
  if (!registro) return 0;
  const passou = registro.falhas - livres;
  if (passou <= 0) return 0;
  const i = Math.min(passou - 1, escada.length - 1);
  return registro.ultimaFalha + escada[i];
}

// Quanto falta de bloqueio, em milissegundos. 0 = liberado.
export function msRestantes(acao, email) {
  const regra = REGRAS[acao];
  if (!regra) return 0;
  const dados = ler();
  const fim = Math.max(
    bloqueioDe(dados[chaveEmail(acao, email)], regra.livres, regra.escada),
    bloqueioDe(dados[chaveTotal(acao)], regra.livresTotal, regra.escada),
  );
  return Math.max(0, fim - Date.now());
}

// Registra uma tentativa e devolve quanto tempo de bloqueio ela causou.
export function registrarTentativa(acao, email) {
  if (!REGRAS[acao]) return 0;
  const dados = ler();
  const agora = Date.now();
  const alvos = [chaveTotal(acao)];
  if (normalizar(email)) alvos.push(chaveEmail(acao, email));
  for (const chave of alvos) {
    const atual = dados[chave] || { falhas: 0, ultimaFalha: 0 };
    dados[chave] = { falhas: atual.falhas + 1, ultimaFalha: agora };
  }
  gravar(dados);
  return msRestantes(acao, email);
}

// Deu certo: zera o contador daquele e-mail. O total também é zerado — quem
// provou ter a senha de uma conta não é o spraying que ele pega.
export function limparTentativas(acao, email) {
  const dados = ler();
  delete dados[chaveEmail(acao, email)];
  delete dados[chaveTotal(acao)];
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
