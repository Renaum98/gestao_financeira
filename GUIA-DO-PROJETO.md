# MyCounts — Guia do Projeto (para aprender React)

Este guia explica o app **MyCounts** de ponta a ponta e usa o próprio código como
material de estudo de React. Sempre que aparecer um conceito novo, tem uma
**analogia do dia a dia** pra fixar a ideia, o **lugar no código** onde ele
aparece, e no final tem **exercícios** pra você praticar.

> Como usar: leia a Parte 1 e 2 pra ter o mapa. Depois pule pra Parte 4 (conceitos
> de React) — é o coração do aprendizado. Os exercícios da Parte 6 são pra fazer
> com o código aberto do lado.

---

## Parte 1 — O que é o app

MyCounts é um app de **gestão financeira pessoal**: você registra gastos e
entradas, define orçamentos por categoria, cria "caixinhas" (metas de poupança),
acompanha gráficos e recebe lembretes de contas a vencer. Dá pra usar sozinho ou
em **conta compartilhada** (ex: um casal vê os gastos um do outro).

**A stack (as ferramentas):**

| Peça | O que faz | Analogia |
|------|-----------|----------|
| **React** | Monta a interface a partir de "componentes" | O pedreiro que levanta a casa a partir de tijolos (componentes) |
| **Vite** | Empacota o código e roda o servidor de desenvolvimento | A esteira da fábrica que junta tudo e entrega pronto |
| **Firebase (Auth + Firestore)** | Login e banco de dados na nuvem, em tempo real | O cofre do banco + o porteiro que confere quem entra |
| **PWA** | Faz o site virar "app instalável" no celular | Um envelope que transforma uma carta em encomenda rastreável |

Não existe "backend próprio": o React fala **direto** com o Firebase. As regras de
quem pode ler/escrever ficam nas *Security Rules* do Firestore (no console do
Firebase, não no código).

---

## Parte 2 — Mapa de pastas

```
src/
├── main.jsx              Ponto de entrada: "liga" o React na página
├── app.jsx               Componente raiz: login, navegação e estado central
├── data.js               Constantes + funções puras (categorias, formatação, somas)
├── styles.css            Importa os CSS por tema (styles/*.css)
├── styles/               base, layout, components, animations, loaders
│
├── screens/              Uma "tela" por arquivo (ou pasta)
│   ├── dashboard.jsx        + dashboard/   (Início)
│   ├── analise.jsx          + analise/     (gráficos)
│   ├── caixinhas.jsx        + caixinhas/   (metas de poupança)
│   ├── perfil.jsx           + perfil/      (conta, aparência)
│   ├── notificacoes.jsx     + notificacoes/(lembretes)
│   ├── gastos.jsx, orcamentos.jsx, recorrentes.jsx, historico.jsx, ...
│
├── modals/               Janelas que abrem por cima (add-expense, simular-gasto)
├── ui/                   Peças reusáveis: icons, common (Card, TopBar), charts, modal-base
└── lib/                  Lógica "sem tela": firebase, storage, colors, selic, export...
```

**Padrão importante do projeto:** telas grandes seguem o estilo
**"orquestrador + peças"**. O arquivo principal (ex: `dashboard.jsx`) calcula os
dados e decide o que mostrar; os arquivos da pasta (`dashboard/CardSaldo.jsx`,
etc.) são as peças visuais. É como um **chef** (orquestrador) que prepara os
ingredientes e monta o prato, enquanto cada **utensílio/forma** (componente) cuida
de um pedaço.

---

## Parte 3 — O fluxo do app (do clique até o Firebase)

Imagine a jornada de um gasto novo:

1. Você toca em **"+"** → abre o `AddExpenseModal` (uma janela).
2. Você preenche e salva → o modal chama `salvarTx(...)` (uma função que mora no
   `app.jsx`).
3. `salvarTx` chama `cloud.setTxs(...)` → isso atualiza o **estado** e marca que
   "txs mudou".
4. O hook `useCloudState` (em `lib/storage.js`) percebe a mudança e manda só o que
   mudou pro Firestore (`updateDoc`).
5. O Firestore confirma e **avisa de volta** via `onSnapshot` → o estado se
   atualiza → o React **re-desenha** as telas que usam `txs`.

Repare no detalhe bonito: o dado **volta** do Firebase e re-renderiza a tela. É
como mandar uma carta e o próprio correio te avisar, sozinho, quando ela chega no
destino. Isso é o **tempo real** do Firestore.

```
[clique] → salvarTx → setTxs → (estado muda) → React re-desenha
                          ↓
                      updateDoc → Firestore → onSnapshot → setState → re-desenha
```

---

## Parte 4 — Conceitos de React (com analogias)

Aqui é onde você aprende React de verdade. Cada conceito tem: **o que é**, uma
**analogia**, e **onde ver no projeto**.

### 4.1 Componente

**O que é:** uma função que recebe dados e devolve um pedaço de tela (JSX). O nome
sempre começa com letra **maiúscula**.

**Analogia:** uma **forma de bolo**. Você põe os ingredientes (props) e sai sempre
um bolo no mesmo formato. A mesma forma serve pra fazer 10 bolos.

**No projeto:** `CardCaixinha` é uma forma; a tela de caixinhas usa ela 3 vezes
(uma por caixinha) sem reescrever nada.

```jsx
// src/screens/caixinhas/CardCaixinha.jsx
export function CardCaixinha({ cx, ocultar, onClick }) {
  return <div onClick={onClick}>{cx.nome}</div>;
}
```

### 4.2 JSX

**O que é:** aquele "HTML dentro do JavaScript". Não é HTML de verdade — é
açúcar sintático que vira chamadas de função.

**Analogia:** é como escrever uma **carta usando um modelo pronto**, onde você pode
colar pedaços de texto calculados na hora (`{variavel}`).

```jsx
<div style={{ fontSize: 14 }}>Olá, {primeiroNome} ✦</div>
```

As chaves `{ }` significam "aqui entra JavaScript". `style={{...}}` tem chave dupla
porque é "JS (chave de fora) contendo um objeto (chave de dentro)".

### 4.3 Props (propriedades)

**O que é:** os dados que um componente **pai** passa pro **filho**. São
**somente leitura** — o filho não pode alterá-las.

**Analogia:** uma **comanda de pedido** no restaurante. O garçom (pai) entrega a
ficha pro cozinheiro (filho). O cozinheiro lê e cozinha, mas **não rabisca** a
comanda — se quiser mudar o pedido, ele avisa o garçom.

**No projeto:** o `Dashboard` passa props pro `CardSaldo`:

```jsx
// src/screens/dashboard.jsx
<CardSaldo mesCard={mes} ocultar={ocultar} setMes={setMes} ... />
```

> 💡 "Como o filho avisa o pai?" → o pai passa uma **função** como prop (ex:
> `onClick`, `setMes`). O filho chama essa função. É o cozinheiro tocando a
> campainha que o garçom deixou na cozinha.

### 4.4 Estado (`useState`)

**O que é:** a "memória" de um componente. Quando o estado muda, o React
**re-desenha** o componente.

**Analogia:** um **quadro branco**. Você apaga e reescreve um número, e *como num
passe de mágica* todo mundo que olhava pro quadro vê o novo valor. Em React, esse
"todo mundo olhando" é a tela sendo redesenhada.

**No projeto:** o card de Insights guarda qual insight está na tela:

```jsx
// src/screens/dashboard/InsightsCard.jsx
const [insightIdx, setInsightIdx] = React.useState(0);
// ...mais tarde:
setInsightIdx((i) => (i + 1) % insights.length); // troca → re-desenha
```

`useState(0)` devolve um par: **o valor** (`insightIdx`) e **a função que troca**
(`setInsightIdx`). Regra de ouro: **nunca** mude o valor direto
(`insightIdx = 5` ❌). Sempre use a função (`setInsightIdx(5)` ✅) — senão o React
não fica sabendo que precisa redesenhar.

### 4.5 Efeitos (`useEffect`)

**O que é:** roda um código **depois** que a tela é desenhada, geralmente pra
"falar com o mundo de fora" (timers, rede, eventos do navegador).

**Analogia:** um **despertador com condição**. "Quando o relógio bater nessas
horas (lista de dependências), toque o alarme (a função)." Se nada na lista mudou,
o alarme não toca.

**No projeto:** o card de insights troca o insight a cada 10 segundos:

```jsx
// src/screens/dashboard/InsightsCard.jsx
React.useEffect(() => {
  if (insights.length <= 1) return;
  const id = setInterval(() => setInsightIdx((i) => (i + 1) % insights.length), 10000);
  return () => clearInterval(id); // "limpeza": desliga o timer antigo
}, [insights.length]); // só re-arma se a quantidade de insights mudar
```

Dois detalhes cruciais:
- **A lista de dependências `[insights.length]`** = "re-execute só quando isso
  mudar". Lista vazia `[]` = "rode uma vez só, na montagem".
- **O `return () => ...`** é a **faxina**. Antes de rodar de novo (ou ao sair da
  tela), o React executa essa limpeza. É como **apagar a vela velha antes de
  acender a nova** — sem isso, ficariam vários timers acesos ao mesmo tempo.

### 4.6 `useMemo` — guardar um cálculo caro

**O que é:** memoriza o **resultado** de um cálculo e só recalcula quando as
dependências mudam.

**Analogia:** **anotar o resultado de uma conta difícil num papel**. Enquanto os
números não mudam, você lê do papel em vez de refazer a conta.

**No projeto:** o Dashboard calcula os totais do mês uma vez e reaproveita:

```jsx
// src/screens/dashboard.jsx
const saldo = React.useMemo(
  () => calcularSaldoMes(mes, { txs, caixinhas, ... }),
  [mes, txs, caixinhas, ...] // recalcula só se algo aqui mudar
);
```

Sem `useMemo`, a conta rodaria a cada re-render (que pode acontecer muitas vezes).

### 4.7 `useCallback` — guardar uma *função*

É o primo do `useMemo`, mas pra **funções**. Útil quando você passa uma função pra
um filho e não quer que ela "nasça de novo" a cada render. Veja
`irInsight` em `InsightsCard.jsx`.

**Analogia:** em vez de **escrever a mesma receita num papel novo toda vez**, você
guarda a receita e reusa o mesmo papel.

### 4.8 `useRef` — uma caixinha que **não** redesenha

**O que é:** guarda um valor que **sobrevive** entre renders, mas mudá-lo **não**
dispara redesenho.

**Analogia:** um **post-it grudado por dentro do armário**. Você anota e consulta,
mas isso não muda a decoração da sala (a tela). Serve pra: referenciar um elemento
do DOM, guardar um timer, lembrar a posição de um toque.

**No projeto:**
- `inputFotoRef` aponta pro `<input type="file">` escondido pra poder "clicar" nele
  por código (`src/screens/perfil/CabecalhoPerfil.jsx`).
- `swipeRef` guarda onde o dedo começou o gesto, sem redesenhar a cada pixel
  (`InsightsCard.jsx`).

```jsx
const inputFotoRef = React.useRef(null);
// no JSX: <input ref={inputFotoRef} ... />
const escolherFoto = () => inputFotoRef.current?.click();
```

### 4.9 Hooks customizados — montar seu próprio "eletrodoméstico"

**O que é:** uma função que **começa com `use`** e combina hooks do React pra criar
uma funcionalidade reutilizável.

**Analogia:** combinar um motor + lâminas (hooks básicos) num **liquidificador**
(hook customizado). Agora qualquer um usa o liquidificador inteiro, sem montar de
novo.

**No projeto:**
- `useCloudState(uid)` (`lib/storage.js`) — conecta o app ao Firestore e devolve
  `txs`, `setTxs`, etc., já sincronizados. Por dentro usa `useState`, `useEffect`,
  `useRef`.
- `useSelic()` (`lib/selic.js`) — busca a taxa Selic e devolve o número pronto.

### 4.10 `ctx` aqui **NÃO é** React Context (cuidado!)

Este é um ótimo ponto de aprendizado. O projeto monta um objetão chamado `ctx` no
`app.jsx` e passa ele como prop pra cada tela:

```jsx
// src/app.jsx
const ctx = { txs, mes, setMes, ocultar, irPara, salvarTx, /* ...dezenas de coisas */ };
// ...
<DashboardScreen ctx={ctx} />
```

**Analogia:** uma **mochila de viagem** que o App entrega pra cada tela com tudo
que ela *pode* precisar (dados + funções). A tela abre a mochila e pega o que quer.

⚠️ Apesar do nome, isto **não** é a API `React.createContext`/`useContext`. É só uma
prop comum — uma técnica chamada **"prop drilling"** (passar dados por props).
Funciona bem aqui porque tudo passa por um único nível (App → Tela). Quando você
estudar **React Context** de verdade, vai reconhecer que ele resolve o mesmo
problema de um jeito diferente (sem precisar passar a mochila na mão). Bom tema
pra um exercício avançado!

### 4.11 Renderização condicional

**O que é:** mostrar (ou não) um pedaço da tela conforme uma condição.

**Analogia:** um **porteiro**. Só deixa o elemento "entrar" na tela se a regra bater.

**No projeto:**

```jsx
// "E lógico": só mostra se a condição for verdadeira
{totalNotif > 0 && <Badge>{totalNotif}</Badge>}

// Ternário: escolhe entre A e B
{ehDesktop ? <CardUnico/> : <Carrossel/>}

// Early return: a própria tela decide o que renderizar antes de tudo
if (usuario === null) return <LoginScreen />;
```

O `app.jsx` usa **early returns** em sequência pra "gatear" o app: sem sessão →
`LoginScreen`; e-mail não verificado → `VerifyEmailScreen`; dados carregando →
`Splash`; primeira vez → `Onboarding`; só então mostra o app. É uma **catraca**
com vários estágios.

### 4.12 Listas e `key`

**O que é:** transformar um array em vários elementos com `.map()`. Cada item
precisa de uma `key` única.

**Analogia:** **etiquetas com nome** em cada mala na esteira do aeroporto. Sem a
etiqueta (`key`), o React se confunde sobre qual item é qual quando a lista muda.

```jsx
// src/screens/caixinhas/ListaCaixinhas.jsx
{caixinhas.map((cx) => (
  <CardCaixinha key={cx.id} cx={cx} ocultar={ocultar} />
))}
```

Use sempre um **id estável** como key (aqui, `cx.id`). Evite usar o índice do
array como key quando a lista pode reordenar.

### 4.13 Inputs controlados

**O que é:** o React é o "dono" do valor do campo. O `value` vem do estado e o
`onChange` atualiza o estado.

**Analogia:** um **caixa eletrônico**: o que aparece na tela é sempre o que o
sistema decidiu mostrar, não o que você "acha" que digitou. A fonte da verdade é o
estado.

```jsx
const [nome, setNome] = React.useState("");
<input value={nome} onChange={(e) => setNome(e.target.value)} />
```

### 4.14 Portais (modais)

**O que é:** `createPortal` renderiza um componente em **outro lugar** do HTML
(geralmente direto no `<body>`), mesmo que o código esteja "fundo" na árvore.

**Analogia:** uma **porta mágica**. Você desenha a janela aqui no seu código, mas
ela aparece lá no topo da casa, por cima de tudo. Perfeito pra modais (que não
podem ficar "presos" dentro de um card).

**No projeto:** `src/screens/caixinhas/ModalShell.jsx` e os modais do perfil usam
`createPortal(..., document.body)`.

### 4.15 Code splitting (`React.lazy` + `Suspense`)

**O que é:** carregar o código de uma tela **só quando** ela for usada, pra o app
abrir mais rápido.

**Analogia:** um **livro que baixa o capítulo só quando você chega nele**, em vez
de baixar o livro inteiro de cara.

**No projeto:**

```jsx
// src/app.jsx
const AnaliseScreen = lazyNamed(() => import("./screens/analise.jsx"), "AnaliseScreen");
// ...
<React.Suspense fallback={<Splash />}>
  <Onboarding ... />
</React.Suspense>
```

`Suspense` mostra um "carregando" (`fallback`) enquanto o pedaço chega.

### 4.16 Funções puras (fora do React)

**O que é:** funções que só dependem das entradas e não tocam em estado/tela. Vivem
em `data.js`, `lib/saldo-mes.js`, `lib/insights.jsx`, etc.

**Analogia:** uma **calculadora**. Dá os mesmos números de entrada → sai sempre o
mesmo resultado. Fácil de testar e de confiar.

**No projeto:** `calcularSaldoMes`, `totalGeral`, `fmtBRL`, `calcularNotificacoes`.
Manter a "matemática" separada do "desenho" deixa os componentes simples.

> Esse foi inclusive um padrão que apareceu no refactor: a conta de saldo estava
> duplicada e foi extraída pra `lib/saldo-mes.js`, usada tanto pelo card quanto
> pelo Dashboard.

---

## Parte 5 — Padrões de arquitetura do projeto

1. **Orquestrador + peças.** A tela-mãe calcula dados e estados; os componentes
   filhos só recebem props e desenham. Ex: `dashboard.jsx` (mãe) +
   `dashboard/CardSaldo.jsx` (peça).

2. **Lógica pura em `lib/` e `data.js`.** Toda conta importante fica fora dos
   componentes. Vantagem: dá pra reaproveitar e testar sem React.

3. **A `mochila ctx`.** Um único objeto carrega dados + ações do `app.jsx` pras
   telas. Simples, mas cresce — por isso é candidato a virar React Context no
   futuro.

4. **Sincronização em tempo real.** `useCloudState` escreve só o que mudou
   (`updateDoc` granular) e ouve o servidor (`onSnapshot`). Estado local e nuvem
   ficam "espelhados".

5. **CSS por tema com variáveis.** As cores vêm de variáveis CSS (`--primary`,
   `--ink`...), então trocar o tema é só trocar as variáveis (veja
   `styles/base.css` e a "Cor de destaque" no Perfil).

---

## Parte 6 — Exercícios

Faça com o app rodando (`npm run dev`). Comece pelos fáceis. Cada exercício diz o
**objetivo**, **onde mexer**, uma **dica** e o **conceito treinado**.

> Dica geral: depois de cada mudança, salve e veja no navegador. Erros aparecem no
> terminal do `npm run dev` e no console do navegador (F12).

### Nível 1 — Aquecimento (texto e JSX)

**1.1 — Trocar a saudação**
- **Objetivo:** fazer o cabeçalho dizer "Olá" em vez de "Bom dia/Boa tarde".
- **Onde:** `src/screens/dashboard.jsx`, variável `saudacao`.
- **Dica:** é só uma string. Depois tente deixar dinâmica de novo.
- **Conceito:** JSX e variáveis.

**1.2 — Mudar o rodapé do Perfil**
- **Objetivo:** trocar "MyCounts · v1.0" por "MyCounts · beta".
- **Onde:** `src/screens/perfil.jsx` (perto do fim).
- **Conceito:** achar e editar JSX.

**1.3 — Novo texto no estado vazio**
- **Objetivo:** mudar a mensagem "Tudo em dia" das notificações.
- **Onde:** `src/screens/notificacoes/EstadoVazio.jsx`.
- **Conceito:** componente isolado.

### Nível 2 — Props e listas

**2.1 — Mostrar a quantidade de caixinhas**
- **Objetivo:** no título "Caixinhas" da lista, mostrar `Caixinhas (3)`.
- **Onde:** `src/screens/caixinhas/ListaCaixinhas.jsx`.
- **Dica:** use `{caixinhas.length}` dentro do JSX do título.
- **Conceito:** interpolação `{ }` + ler dados de uma prop/array.

**2.2 — Passar uma prop nova**
- **Objetivo:** fazer o `CardCaixinha` aceitar uma prop `destaque` e, quando
  `true`, deixar a borda esquerda mais grossa.
- **Onde:** `src/screens/caixinhas/CardCaixinha.jsx` (recebe a prop) e
  `ListaCaixinhas.jsx` (passa `destaque` na primeira caixinha).
- **Dica:** `width: destaque ? 8 : 4` na barrinha colorida.
- **Conceito:** props + renderização condicional de estilo.

**2.3 — Limitar os "Últimos gastos"**
- **Objetivo:** mostrar 5 gastos recentes em vez de 3 no Dashboard.
- **Onde:** `src/screens/dashboard.jsx`, `const recentes = txMes.slice(0, 3)`.
- **Conceito:** estado derivado (calcular a partir de outro dado).

### Nível 3 — Estado e eventos

**3.1 — Botão "ver mais/ver menos"**
- **Objetivo:** em "Últimos gastos", começar com 3 e ter um botão que alterna pra
  mostrar 10.
- **Onde:** componha em `dashboard.jsx` (ou em `UltimosGastos.jsx`).
- **Dica:** `const [expandido, setExpandido] = useState(false)` e
  `txMes.slice(0, expandido ? 10 : 3)`.
- **Conceito:** `useState` + `onClick`.

**3.2 — Quarto tema**
- **Objetivo:** o seletor de tema tem "Sistema/Claro/Escuro". Adicione um item
  fake "Sépia" (pode só mudar o estado por enquanto).
- **Onde:** `src/screens/perfil/AparenciaCard.jsx`, array de opções.
- **Conceito:** listas + estado que vem das `preferences`.

**3.3 — Contador de cliques (sandbox)**
- **Objetivo:** crie um componente novo `Contador.jsx` em `src/ui/` com um botão
  que soma 1 a cada clique, e renderize ele temporariamente no Dashboard.
- **Dica:** `const [n, setN] = useState(0)` e `<button onClick={() => setN(n+1)}>`.
- **Conceito:** o ciclo completo: estado → evento → re-render.

### Nível 4 — Efeitos, memo e refs

**4.1 — Mudar o tempo do carrossel de insights**
- **Objetivo:** trocar a rotação de 10s pra 4s.
- **Onde:** `src/screens/dashboard/InsightsCard.jsx`, o `setInterval(..., 10000)`.
- **Dica:** observe a "faxina" `clearInterval` no `return` do `useEffect`.
- **Conceito:** `useEffect` + cleanup.

**4.2 — Relógio na tela**
- **Objetivo:** mostrar a hora atual atualizando a cada segundo em algum canto.
- **Dica:** `useState` pra hora + `useEffect` com `setInterval` que faz
  `setHora(new Date())`, e **não esqueça** o `clearInterval` no cleanup.
- **Conceito:** efeito com timer + por que o cleanup importa.

**4.3 — Novo "stat card" na Análise**
- **Objetivo:** adicionar um quinto card no resumo (ex: "Maior gasto" do mês).
- **Onde:** calcule o valor em `analise.jsx` e passe pro `analise/ResumoMes.jsx`.
- **Dica:** use `useMemo` pra calcular o maior gasto a partir de `txMes`.
- **Conceito:** `useMemo` + props + composição.

### Nível 5 — Desafios

**5.1 — Novo insight**
- **Objetivo:** criar uma frase de insight nova (ex: "Você gastou X% em
  alimentação este mês").
- **Onde:** `src/lib/insights.jsx` (`computeInsights`). É função **pura** — teste a
  lógica sem mexer em tela.
- **Conceito:** separar matemática de UI.

**5.2 — Migrar a `mochila ctx` pra React Context (avançado)**
- **Objetivo:** estudar `React.createContext` + `useContext` e substituir o
  `ctx={ctx}` por um Provider, deixando as telas lerem do contexto.
- **Onde:** começa no `app.jsx`. Faça numa branch separada.
- **Conceito:** React Context de verdade (vs. o prop drilling atual da Parte 4.10).

**5.3 — Nova coluna no export**
- **Objetivo:** adicionar uma coluna "Mês" (ex: "2026-05") na aba Transações do
  `.xlsx`.
- **Onde:** `src/lib/export.js`, função `linhaTx` (e ajuste as larguras `!cols`).
- **Conceito:** transformar dados + entender que isso não é React, é JS puro.

---

## Parte 7 — Glossário rápido

- **Componente:** função que devolve JSX (a "forma de bolo").
- **Prop:** dado que o pai passa pro filho (a "comanda", só leitura).
- **Estado (state):** memória do componente; mudar → re-desenha (o "quadro branco").
- **Hook:** função `useX` que dá superpoderes a um componente.
- **`useState`:** cria um estado.
- **`useEffect`:** roda algo depois do render / fala com o mundo externo (o "alarme").
- **`useMemo`/`useCallback`:** guardam resultado/função pra não recalcular à toa.
- **`useRef`:** caixinha que persiste e **não** redesenha (o "post-it").
- **Re-render:** o React redesenhar um componente porque algo mudou.
- **Lista de dependências:** o `[...]` no fim de `useEffect`/`useMemo` — os
  "gatilhos".
- **Prop drilling:** passar dados por props nível a nível (o que o `ctx` faz).
- **Portal:** renderizar em outro lugar do HTML (a "porta mágica" dos modais).
- **Code splitting:** carregar código sob demanda (`React.lazy` + `Suspense`).
- **Função pura:** mesma entrada → mesma saída, sem efeitos colaterais.

---

### Próximos passos sugeridos

1. Faça os exercícios do Nível 1 a 3 — eles cobrem 80% do React do dia a dia.
2. Leia `InsightsCard.jsx` inteiro: ele junta `useState`, `useEffect`, `useRef` e
   `useCallback` num só lugar pequeno — é um ótimo "estudo de caso".
3. Quando estiver confortável, encare o desafio 5.2 (React Context). Aí você vai
   ter entendido a maior decisão de arquitetura deste projeto.

Bons estudos! 🚀
