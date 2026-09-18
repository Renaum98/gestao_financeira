# Notificações push — o que ligar para funcionar

O código está pronto, mas o push depende de quatro coisas que só existem FORA
do repositório: as Security Rules novas, uma conta de serviço do Firebase, as
variáveis na Vercel e o cron. Sem elas o app continua funcionando normalmente
— os lembretes seguem chegando ao abrir o app, só não chegam com ele fechado.

É a mesma montagem da cineteca (`bib_filmes/api/push.ts`): uma função na
Vercel, `web-push` com chaves VAPID, conta de serviço via `jose`, sem
`firebase-admin`. A diferença é o gatilho: lá quem dispara é uma ação de outra
pessoa; aqui é o calendário, então a função roda num cron diário.

## Como funciona (o mapa)

```
 cron da Vercel, todo dia às 09:00 (BRT)             ← vercel.json → "crons"
   │  GET /api/push/enviar  com  Authorization: Bearer <CRON_SECRET>
   ▼
 api/push/enviar.js
   │  lê pushSubs/ (todas as assinaturas) com a CONTA DE SERVIÇO, por REST
   │  agrupa por usuário e lê users/<uid>
   │  monta as notificações com calcularNotificacoes — o MESMO código do app
   │  pula o que aquele aparelho já recebeu (campo `enviadas`) e o que foi lido
   │  assina com a chave VAPID privada e manda
   ▼
 serviço de push da Apple / Google / Mozilla
   ▼
 service worker do PWA (public/sw-notifications.js) → notificação
   └─ toque → foca o app (ou abre)
```

- A assinatura de cada aparelho fica em `pushSubs/<hash do endpoint>` com o
  `uid` do dono (`src/lib/push.js`). Ela nasce sozinha quando a pessoa aceita
  a permissão de notificação na tela de Notificações — não há um segundo
  botão: quem quer lembrete quer lembrete com o app fechado também.
- Os dois lados não se repetem: o que o app mostra localmente ao abrir vai pro
  `enviadas` da assinatura; o que o cron mandou vem de lá pro `localStorage` na
  próxima abertura. Marcar como lida no app também tira do push.
- Excluir a conta apaga as assinaturas (`src/lib/account.js`); uma assinatura
  que o serviço de push já não reconhece (404/410) é apagada pelo cron.

## Passo 1 — Publicar as Security Rules

`firestore.rules` ganhou a coleção `pushSubs`. Publique o arquivo inteiro no
console (Firestore Database → Regras), como das outras vezes.

Sem isto: a assinatura é feita no navegador mas o doc não grava
(`permission-denied` no console do app), e o cron não encontra ninguém.

## Passo 2 — Conta de serviço do Firebase

1. Firebase → ⚙️ Configurações do projeto → **Contas de serviço** → **Gerar
   nova chave privada**. Baixa um JSON.
2. É a credencial que dá à função leitura de tudo no banco, por cima das
   regras. **Não entra no repositório.** Vai só para a Vercel (passo 3).

## Passo 3 — Variáveis na Vercel

Projeto → Settings → Environment Variables. Marque Production (e Preview, se
quiser testar por lá).

| Nome                       | Valor                                                                  |
| -------------------------- | ---------------------------------------------------------------------- |
| `FIREBASE_SERVICE_ACCOUNT` | o conteúdo INTEIRO do JSON do passo 2, numa linha só                   |
| `VAPID_PUBLIC_KEY`         | o mesmo valor de `VAPID_PUBLIC_KEY` em `src/lib/push.js`               |
| `VAPID_PRIVATE_KEY`        | o valor de `VAPID_PRIVATE_KEY` no `.env` da raiz (fora do git)          |
| `VAPID_SUBJECT`            | `mailto:` com um e-mail seu (o protocolo exige um contato)             |
| `CRON_SECRET`              | uma string longa e aleatória; a Vercel a manda no header de cada disparo |
| `PUSH_TZ`                  | (opcional) fuso do "hoje" do cron; padrão `America/Sao_Paulo`          |

Diferente das `VITE_*`, estas são lidas em **runtime** pela função: não precisa
rebuild, mas precisa de um **redeploy** para a função nascer com elas.

## Passo 4 — O cron

Já está no `vercel.json`: `"crons": [{ "path": "/api/push/enviar", "schedule": "0 12 * * *" }]`.
O horário é em UTC — `0 12` são 09:00 no Brasil. A Vercel lê isso no deploy e
mostra em Settings → Cron Jobs.

No plano Hobby o cron roda uma vez por dia e o horário exato pode variar dentro
da hora. Pra disparar na mão (e ver a resposta):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://SEU-DOMINIO/api/push/enviar
```

A resposta é o resumo da rodada: `{ usuarios, assinaturas, enviadas, removidas, erros }`.

## Passo 5 — Ligar num aparelho

Notificações → **Ativar** (o banner só aparece enquanto a permissão não foi
dada). Aceita, e a linha "Lembretes por push ativos neste aparelho" aparece
com um **Testar**: manda uma notificação de teste na hora, pra não precisar
esperar o cron.

- **Android/Chrome:** funciona no site aberto e no app instalado.
- **iPhone:** só o app **instalado na tela de início** (iOS 16.4+). No Safari
  aberto como site, `PushManager` nem existe e o app fica só com os lembretes
  locais. E o iOS ainda pode atrasar entregas em modo de baixa energia e apaga
  a permissão se o app ficar semanas sem abrir.
- Permissão negada uma vez só volta pelos ajustes do sistema; o banner avisa.
- Quem já tinha dado a permissão antes desta versão é assinado sozinho na
  próxima abertura — não precisa fazer nada.

## Como conferir que está entregando

1. Botão **Testar** na tela de Notificações: `Enviado` quer dizer que o serviço
   de push aceitou; a notificação deve aparecer em seguida (feche o app pra ver
   o caso real).
2. Logs da função: Vercel → projeto → Logs. Cada rodada do cron responde o
   resumo; `erros` lista o uid e o motivo de cada falha.
3. `removidas > 0` são assinaturas mortas (aparelho revogou, limpou o site ou
   conta apagada), que a função apaga sozinha.

## Em desenvolvimento

`npm run dev` só serve o front — as funções em `api/` não rodam, e o botão
Testar responde "Falhou". Pra testar o servidor localmente, `vercel dev` com as
variáveis do passo 3 no `.env`.

## Trocar as chaves VAPID

Só se a privada vazar ou se perder. Gere um par novo (`npx web-push
generate-vapid-keys`), troque a pública em `src/lib/push.js` e as duas na
Vercel. Todas as assinaturas antigas param de valer: cada aparelho precisa
ativar as notificações de novo (o app refaz sozinho na próxima abertura, porque
a assinatura antiga deixa de bater com a chave e o `subscribe` gera outra).
