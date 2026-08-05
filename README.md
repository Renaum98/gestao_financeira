# MyCounts — gestão financeira

App de finanças pessoais para uso diário no celular. **PWA** instalável, dados sincronizados em **Firebase Firestore**, gateado por **PIN local de 4 dígitos**. Stack: React + Vite + Firebase, sem backend próprio.

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
2. **Authentication** → Sign-in method → ative **Anonymous**.
3. **Firestore Database** → crie um banco em modo de produção.
4. **Cole estas Security Rules** (cada usuário só lê/escreve no próprio doc):

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```

5. Em **Configurações do projeto → Seus apps**, adicione um app Web e copie a `firebaseConfig`.
6. Cole as chaves em **um destes lugares**:
   - **Opção A (recomendado)**: copie `.env.example` para `.env` e preencha as variáveis `VITE_FIREBASE_*`.
   - **Opção B**: edite diretamente `src/lib/firebase.js` (bloco bem marcado no topo).

> A chave do Firebase é **pública por design** — pode ir no repositório. O controle de acesso vem das Security Rules acima, não da chave.

> As regras acima são só o mínimo pra subir. As que valem estão em [`firestore.rules`](firestore.rules) — publique esse arquivo antes de abrir o app pra outras pessoas.

## Proteção contra bot

Criar conta no Firebase Auth é grátis e automatizável, então "está autenticado" não quer dizer que tem gente do outro lado. A defesa está em três camadas:

1. **Security Rules** (`firestore.rules`) — toda escrita exige `email_verified`. Um bot que cria contas em massa fica com contas vazias que não gravam nada.
2. **App Check** (`src/lib/app-check.js`) — atesta que a requisição veio do nosso app, e não de um script falando com a API REST. É a única camada que barra o bot *antes* de ele consumir cota.
3. **Trava no formulário** (`src/lib/rate-limit-auth.js`) — escada de espera por e-mail e no total, separada para login, cadastro e recuperação de senha. Vive no navegador: pega quem martela a tela, não quem ignora a tela.

Para ligar o App Check (só a camada 2 precisa de configuração):

1. Console do Firebase → **App Check → Apps** → registra o app Web com o provedor **reCAPTCHA v3**. Ele gera uma chave de site.
2. Põe a chave no `.env` como `VITE_FIREBASE_APPCHECK_KEY` (e nas Environment Variables da Vercel / Secrets do GitHub Actions).
3. Em dev, gera um token de debug em **App Check → Apps → Gerenciar tokens de depuração** e põe em `VITE_FIREBASE_APPCHECK_DEBUG_TOKEN`.
4. Deixa alguns dias com a métrica em **Não aplicado**; quando as requisições verificadas forem a maioria, liga o **Aplicar** no Cloud Firestore e no Authentication.

Sem a variável de ambiente o módulo não faz nada e o app roda como antes — configurar pela metade não derruba ninguém.

Vale ligar também, no Console: **Authentication → Settings → Proteção contra enumeração de e-mail**, e a política de senha (mínimo 8 caracteres), que hoje só é exigida no cliente.

## Build + Deploy no GitHub Pages

O repositório já tem o workflow `.github/workflows/deploy.yml`. Para publicar:

1. Crie o repositório no GitHub e dê push.
2. Em **Settings → Pages**, escolha **GitHub Actions** como source.
3. Em **Settings → Secrets and variables → Actions**, adicione as variáveis de ambiente do Firebase (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, etc.) — ou hardcode em `firebase.js` antes do push.
4. Faça push na `main`. O workflow builda e publica em `https://<usuario>.github.io/<repo>/`.

> Importante: depois do deploy, adicione o domínio `<usuario>.github.io` em **Firebase → Authentication → Settings → Authorized domains**.

## Instalar no celular

Pelo Chrome do Android: menu → **Instalar app**.
Pelo Safari iOS: compartilhar → **Adicionar à Tela de Início**.

Depois disso abre fullscreen, com ícone próprio, e funciona offline (cache do Service Worker).

## Estrutura

```
gestao_financeira/
├── index.html                  Shell HTML mínimo (Vite injeta o resto)
├── package.json
├── vite.config.js              Configuração Vite + PWA + base path
├── .env.example                Template das variáveis Firebase
├── .github/workflows/deploy.yml  CI → GitHub Pages
├── public/
│   └── logo.png                Ícone-fonte do app (gera manifest e favicon via scripts/generate-icons.mjs)
└── src/
    ├── main.jsx                Entry point (ReactDOM.createRoot)
    ├── app.jsx                 App raiz: auth, PIN, navegação, estado
    ├── styles.css              CSS global (variáveis de tema)
    ├── data.js                 Categorias, paletas, helpers (fmtBRL, txDoMes…)
    ├── lib/
    │   ├── firebase.js         Init Firebase + auth anônima + Firestore
    │   ├── storage.js          Hook useCloudState (sincroniza com Firestore)
    │   └── pin.js              Hash + verificação do PIN local
    ├── ui/                     Componentes compartilhados
    │   ├── icons.jsx
    │   ├── charts.jsx
    │   └── common.jsx
    ├── screens/                Uma tela por arquivo
    │   ├── pin.jsx             Definir/desbloquear PIN
    │   ├── onboarding.jsx      Tour inicial
    │   ├── dashboard.jsx       Início
    │   ├── gastos.jsx          Lista
    │   ├── analise.jsx         Pizza + ranking
    │   ├── categoria.jsx       Detalhe
    │   ├── orcamentos.jsx      Limites
    │   ├── historico.jsx       Comparativo de meses
    │   └── perfil.jsx          Nome + tema + PIN
    └── modals/
        └── add-expense.jsx     Adicionar/editar gasto
```

## Como os dados ficam armazenados

- **Firestore**: doc `users/{uid}` com `{ txs, orcamentos, preferences }`.
- **Auth**: anônima — cada dispositivo recebe um `uid` próprio e estável.
  - ⚠️ Limpar dados do navegador → perde o `uid` → perde acesso aos dados (ficam orfãos no Firestore). Se for um problema, ative email/senha em `Authentication` e adapte `lib/firebase.js` para vincular conta.
- **PIN**: SHA-256 com salt em `localStorage` (chave `finca.pin.hash`). Não vai para o Firebase. Reset = apagar dados do app no navegador.

## Próximos passos sugeridos

- Vincular conta com email/senha (para usar o mesmo banco de gastos em mais de um celular).
- Notificações push para lembretes de orçamento (precisa do Cloud Messaging do Firebase).
- Categorias customizáveis pelo usuário.
- Export CSV.
