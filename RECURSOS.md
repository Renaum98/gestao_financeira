# MyCounts

**App de finanças pessoais para o dia a dia no celular.** PWA instalável, dados sincronizados em tempo real, funciona offline e pode ser usado sozinho ou a dois.

React + Vite + Firebase (Auth + Firestore). Sem backend próprio — quem controla o acesso são as Security Rules.

---

## O que ele faz

**Transações** — gastos e entradas com categoria, forma de pagamento e data. Dez categorias prontas mais as personalizadas. Compras parceladas viram lançamentos ligados entre si; contas fixas se repetem sozinhas nos meses seguintes.

**Saldo do mês** — o número principal segue uma fórmula explícita: orçamento fixo + entradas − o que foi guardado, mais a sobra ou dívida herdada do mês anterior. Um carrossel desliza entre os meses, e um card de insights comenta os números do mês.

**Orçamentos** — limite geral e por categoria, com alerta de estouro. Cada mês guarda o orçamento que valia *naquele mês*, então subir o valor em agosto não reescreve julho.

**Cartões de crédito** — cada cartão com seu dia de fechamento. O app mostra em qual fatura a compra caiu e quando ela vence, sem nunca pedir o número do cartão.

**Caixinhas** — metas de poupança com depósitos, saques e rendimento projetado pela Meta Selic, buscada na API do Banco Central.

**Análise** — pizza por categoria, evolução mês a mês, maiores gastos, gastos por forma de pagamento e projeção anual. Todos em SVG feito à mão.

**Conta compartilhada** — convite por e-mail e, a partir do aceite, os dois enxergam os gastos um do outro com a autoria preservada em cada lançamento e em cada gráfico.

**E ainda** — simulador de gasto antes de gastar, lembretes nativos de contas a vencer, exportação em `.xlsx` e relatório mensal em PDF, tema claro/escuro, 7 paletas, 2 idiomas e 4 moedas.

---

## As decisões que dão o tom

O que este projeto tem de menos comum não são as telas, são as coisas que ele **não** usa.

| O de praxe | Aqui |
|---|---|
| React Router | navegação própria com pilha de telas |
| Redux / Zustand | estado no topo, em React puro |
| Tailwind / MUI | CSS escrito à mão, dividido por tema |
| Recharts / Chart.js | SVG construído à mão |

**Seis dependências de runtime.** React, React DOM, Firebase, jsPDF, xlsx e sheetjs — e mais nada.

**Offline de verdade.** Dá para lançar um gasto no metrô e ele sobe ao reconectar. O caso difícil é o conflito de escrita de um aparelho que ficou offline, tratado explicitamente com a nuvem prevalecendo.

**Carregamento sob demanda.** Quatorze telas e modais entram por `React.lazy`, e as mais prováveis são pré-carregadas quando o navegador está ocioso. Bundle inicial: 158 kB comprimido.

**Modo leve.** Em aparelhos fracos o app abre mão de enfeite em troca de quadros: o vidro da tab bar vira superfície sólida, o carrossel vira card único, só a aba visível fica montada. A regra do recorte é deliberada — só vira opção o que cobra um preço do usuário.

**Cores calibradas, não escolhidas.** Cada paleta foi medida em OKLCH e ajustada por contraste WCAG nos três papéis que a cor exerce. O motivo de cada tom está escrito ao lado dele no código.

**Anti-bot em camadas.** Criar conta no Firebase Auth é grátis e automatizável, então "está autenticado" não quer dizer que tem gente do outro lado: Security Rules exigindo e-mail verificado, App Check atestando a origem da requisição, e trava progressiva no formulário.

---

📄 [Lista completa de funcionalidades](FUNCIONALIDADES.md) · 🧭 [Guia do projeto](GUIA-DO-PROJETO.md) · ⚙️ [Como rodar](README.md)
