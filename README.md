# MyCounts — gestão financeira

App de finanças pessoais para uso diário no celular. **PWA** instalável, dados sincronizados em **Firebase Firestore**, login por **e-mail e senha** com verificação. Stack: React + Vite + Firebase, sem backend próprio.

Para a lista do que o app faz, veja [FUNCIONALIDADES.md](FUNCIONALIDADES.md). Para entender o código por dentro, o [Guia do Projeto](GUIA-DO-PROJETO.md).

## Como rodar localmente

```bash
npm install
npm run dev
```

Abra a URL impressa no terminal (algo como `http://localhost:5173`). Para testar no celular na mesma rede:

```bash
npm run dev -- --host
```

E acesse `http://<ip-do-pc>:5173` pelo navegador do celular.

## Configurar o Firebase (obrigatório)

O app **não funciona** sem um projeto Firebase configurado.

1. Em [console.firebase.google.com](https://console.firebase.google.com), crie um projeto.
2. **Authentication** → Sign-in method → ative **E-mail/senha**.
3. **Firestore Database** → crie um banco em modo de produção.
4. **Publique as Security Rules** de [`firestore.rules`](firestore.rules) — cole o conteúdo do arquivo na aba "Regras" do Console, ou rode `firebase deploy --only firestore:rules`.

   As regras são parte do app, não um detalhe de infraestrutura: é nelas que mora a linha entre "criou uma conta" e "pode gravar" — toda escrita exige e-mail confirmado. Sem publicá-las, o banco fica aberto para qualquer conta recém-criada.

5. Em **Configurações do projeto → Seus apps**, adicione um app Web e copie a `firebaseConfig`.
6. Cole as chaves em **um destes lugares**:
   - **Opção A (recomendado)**: copie `.env.example` para `.env` e preencha as variáveis `VITE_FIREBASE_*`.
   - **Opção B**: edite diretamente `src/lib/firebase.js` (bloco bem marcado no topo).

> A chave do Firebase é **pública por design** — pode ir no repositório. O controle de acesso vem das Security Rules, não da chave.

## Proteção contra bot

Criar conta no Firebase Auth é grátis e automatizável, então "está autenticado" não quer dizer que tem gente do outro lado. A defesa está em três camadas:

1. **Security Rules** (`firestore.rules`) — toda escrita exige `email_verified`. Um bot que cria contas em massa fica com contas vazias que não gravam nada.
2. **App Check** (`src/lib/app-check.js`) — atesta que a requisição veio do nosso app, e não de um script falando com a API REST. É a única camada que barra o bot *antes* de ele consumir cota.
3. **Trava no formulário** (`src/lib/rate-limit-auth.js`) — escada de espera por e-mail e no total, separada para login, cadastro e recuperação de senha. Vive no navegador: pega quem martela a tela, não quem ignora a tela.

Para ligar o App Check (só a camada 2 precisa de configuração):

1. Console do Firebase → **App Check → Apps** → registra o app Web com o provedor **reCAPTCHA v3**. Ele gera uma chave de site.
2. Põe a chave no `.env` como `VITE_FIREBASE_APPCHECK_KEY` (e nas Environment Variables da Vercel).
3. Em dev, gera um token de debug em **App Check → Apps → Gerenciar tokens de depuração** e põe em `VITE_FIREBASE_APPCHECK_DEBUG_TOKEN`.
4. Deixa alguns dias com a métrica em **Não aplicado**; quando as requisições verificadas forem a maioria, liga o **Aplicar** no Cloud Firestore e no Authentication.

Sem a variável de ambiente o módulo não faz nada e o app roda como antes — configurar pela metade não derruba ninguém.

Vale ligar também, no Console: **Authentication → Settings → Proteção contra enumeração de e-mail**, e a política de senha (mínimo 8 caracteres), que hoje só é exigida no cliente.

## Deploy

O app é servido a partir da raiz do domínio (`base: '/'` em `vite.config.js`) e publicado na **Vercel**. O [`vercel.json`](vercel.json) cuida do que um PWA precisa e é fácil de errar:

- **rewrite de SPA** — qualquer rota cai no `index.html`, porque a navegação é do lado do cliente;
- **cache** — `index.html`, `sw.js` e o manifest nunca são cacheados, e os assets com hash no nome são cacheados para sempre. Sem isso, um service worker antigo continua servindo uma versão velha do app depois do deploy.

Para publicar:

1. Importe o repositório na Vercel (o build é `npm run build`, saída em `dist/` — ela detecta sozinha).
2. Em **Settings → Environment Variables**, adicione as variáveis `VITE_FIREBASE_*` do `.env.example`.
3. Faça push na `main`.

> Importante: depois do deploy, adicione o domínio em **Firebase → Authentication → Settings → Authorized domains**. Sem isso o login falha em produção mesmo com tudo o mais certo.

## Instalar no celular

Pelo Chrome do Android: menu → **Instalar app**.
Pelo Safari iOS: compartilhar → **Adicionar à Tela de Início**.

Depois disso abre fullscreen, com ícone próprio, e funciona offline (cache do Service Worker + cache persistente do Firestore).

## Estrutura

```
gestao_financeira/
├── index.html                  Shell HTML mínimo (Vite injeta o resto)
├── vite.config.js              Vite + PWA (manifest, service worker)
├── vercel.json                 Rewrites de SPA + cache do PWA
├── firestore.rules             Security Rules — publique no Console
├── .env.example                Template das variáveis Firebase
├── public/
│   └── logo.png                Ícone-fonte (gera manifest e favicon via scripts/generate-icons.mjs)
└── src/
    ├── main.jsx                Entry point (ReactDOM.createRoot)
    ├── app.jsx                 App raiz: auth, navegação, estado central, tema
    ├── data.js                 Categorias, paletas, helpers (fmtBRL, degradês…)
    ├── styles/                 base, layout, components, animations, loaders
    ├── lib/                    Regras de negócio, sem React
    │   ├── firebase.js           Init + auth por e-mail/senha
    │   ├── storage.js            useCloudState (sincroniza com Firestore)
    │   ├── saldo-mes.js          A conta do saldo do mês
    │   ├── orcamento.js          Orçamento + histórico de vigência por mês
    │   ├── fatura.js             Ciclo de fatura do cartão
    │   ├── caixinhas.js          Saldo de uma caixinha
    │   ├── selic.js              Meta Selic (API do BCB) + rendimento projetado
    │   ├── partnership.js        Conta compartilhada: convite, aceite, vínculo
    │   ├── notifications.js      Lembretes nativos de contas a vencer
    │   ├── i18n.jsx / i18n-dict.js  Tradução pt/en
    │   ├── moeda.js              BRL / USD / EUR / GBP (formato, sem câmbio)
    │   ├── export.js             Planilha .xlsx sob demanda
    │   ├── relatorio-pdf.js      Relatório mensal em PDF
    │   ├── app-check.js          Atestado anti-bot
    │   ├── rate-limit-auth.js    Trava progressiva do formulário
    │   ├── conexao.js            Estado offline + conflito de escrita
    │   ├── leve.js               Modo leve
    │   └── desktop.js            Fonte única do corte mobile/desktop
    ├── ui/                     Componentes compartilhados
    │   ├── charts.jsx            Gráficos SVG feitos à mão
    │   ├── card-destaque.jsx     O card "herói" das telas
    │   ├── logo-animado.jsx      Logo em vetor + animação de abertura
    │   └── loader.jsx            Splash, skeletons e spinner
    ├── screens/                Uma tela por arquivo (ou pasta)
    │   ├── login.jsx             Login/cadastro + verificação de e-mail
    │   ├── onboarding.jsx        Tour inicial
    │   ├── dashboard.jsx         Início
    │   ├── gastos.jsx            Lista de transações
    │   ├── analise.jsx           Gráficos e projeção
    │   ├── orcamentos.jsx        Limites por categoria
    │   ├── caixinhas.jsx         Metas de poupança
    │   ├── cartoes.jsx           Cartões e faturas
    │   ├── recorrentes.jsx       Contas que se repetem
    │   ├── historico.jsx         Comparativo de meses
    │   ├── notificacoes.jsx      Avisos e convites
    │   └── perfil.jsx            Conta, aparência, idioma, moeda
    └── modals/
        ├── add-expense.jsx       Adicionar/editar transação
        └── simular-gasto.jsx     Testar o impacto de um gasto
```

## Como os dados ficam armazenados

- **Auth**: e-mail e senha, com verificação de e-mail. A mesma conta abre em qualquer aparelho.
- **Firestore**: doc `users/{uid}` com `{ txs, orcamentos, caixinhas, recorrentes, categoriasCustom, cartoes, preferences }`.
- **Conta compartilhada**: `invites/{id}` para os convites, `partnerships/{id}` para o vínculo, e `userIndex/{emailLower}` para achar alguém pelo e-mail.
- **Local**: só preferência de aparência e caches (a Meta Selic por 24h, o palpite de sessão que escolhe o que mostrar durante a abertura). Nada de dado financeiro.

Cada coleção é um campo de array no doc do usuário, e toda escrita manda o array inteiro. Isso simplifica muito o app — e cria um caso de conflito quando um aparelho fica offline, que está tratado em `lib/conexao.js` com a nuvem prevalecendo.
