# Cadastro de cartões

Status: **implementado** em 2026-08-14. O desenho foi anotado em 2026-08-11,
depois do ciclo de fatura (branch `fatura-cartao`).

## O que existe

Cadastro de mais de um cartão de crédito, cada um com **nome**, **cor**, **dia
de fechamento** e **limite** próprios. Tela em `src/screens/cartoes/`, chegando
por Perfil → Cartões (e pela sidebar, no desktop).

**Não guardamos número nem bandeira do cartão.** Decisão explícita do usuário: o
que identifica um cartão aqui é o nome que ele deu e a cor que ele escolheu.
Nenhum dado do plástico passa pelo app ou pelo Firestore.

## Modelo de dados

```js
cartoes: [ { id, nome, cor, diaFechamento, limite, criadoEm } ]
```

- `cor`: hex. Os presets em `CORES_CARTAO` (`src/lib/cartoes.js`) são as cores
  dos bancos mais conhecidos por aqui — é paleta de reconhecimento, não
  integração nem vínculo com banco nenhum.
- `diaFechamento`: generaliza `preferences.diaFechamentoCartao` (0 = último dia
  do mês). O global continua valendo pra quem não cadastrou cartão nenhum.
- `limite`: teto do banco (0 = não informado). **Não** se confunde com
  `preferences.orcamentoCartaoCredito`, que é meta mensal de gasto. O que ocupa
  o limite é a fatura aberta + a fechada que ainda vai vencer (`usoDoCartao`).

Cor clara (o amarelo do BB, por exemplo) quebraria o texto branco por cima, então
`corTextoSobre()` decide entre branco e escuro por luminância — quem pinta com a
cor do cartão passa por lá.

Na transação e na recorrência, um campo novo e **opcional**:

```js
{ ..., pagamento: "Cartão de crédito", cartaoId: "ct-…" }
```

## A regra de convivência com o que já existia

Combinada em 2026-08-14. Está escrita por extenso no cabeçalho de
`src/lib/cartoes.js` — este resumo é o mapa.

- **Zero cartões** → nada muda. `"Cartão de crédito"` segue etiqueta solta,
  fatura única, fechamento global. É o app de antes, intacto.
- **Ao criar o primeiro cartão** → backfill: toda tx e toda recorrência no
  crédito ganha `cartaoId` dele. Roda uma vez só, na criação. Custa uma escrita
  (`txs` é um campo único do doc do usuário).
- **Do segundo em diante** → nada é tocado. Mudar um gasto de cartão é manual,
  pelo seletor no modal de gasto.

Escolhemos o backfill em vez do "cartão padrão implícito" (tx sem `cartaoId` =
primeiro cartão, resolvido na leitura) porque o implícito obriga toda tela que
agrupa por cartão a repetir a regra, e faz o histórico inteiro trocar de dono
sozinho no dia em que o primeiro cartão for apagado.

O cartão novo **herda o fechamento global** ao ser criado. Sem isso, quem tinha
configurado "fecha dia 20" veria todas as faturas passadas se reagruparem
sozinhas ao cadastrar o primeiro cartão.

### Apagar cartão

Único jeito de gerar tx órfã. O modal de exclusão mostra quantos lançamentos
estão presos e pergunta o destino: outro cartão, ou "sem cartão" (volta ao
crédito genérico). Com um cartão só não há o que perguntar — os lançamentos
voltam a ser crédito sem cartão, que é exatamente o app de antes do cadastro.
Nada é apagado e nenhum valor muda.

Tx órfã aparece como grupo "Sem cartão" no Dashboard e como chip no filtro de
Transações.

## Onde isso encostou

| Arquivo | Mudança |
|---|---|
| `src/lib/cartoes.js` | **Novo.** Paleta, uso do limite, backfill, contagem e movimentação de lançamentos. |
| `src/lib/fatura.js` | `totalFatura`/`faturasEmAberto` aceitam `cartaoId`; `faturasPorCartao` monta um grupo por cartão. O ciclo em si não mudou. |
| `src/lib/storage.js`, `src/lib/compact.js` | `cartoes` em `SYNCED_KEYS` + compactação (`diaFechamento` 0 não é gravado). |
| `src/app.jsx` | `salvarCartao` (com o backfill do primeiro), `excluirCartao` (com destino); `cartaoId` propagado em parcelas, recorrências geradas e `editarRecorrente`. |
| `src/screens/cartoes/` | **Novo.** Lista, modal de cadastro, modal de exclusão. |
| `src/modals/add-expense.jsx` | Seletor de cartão no crédito; o aviso de fatura usa o fechamento do cartão escolhido. |
| `src/screens/dashboard/FaturaCartao.jsx` | Uma linha de fatura por cartão. Com 1 cartão, igual a antes. |
| `src/screens/orcamentos.jsx` | Com cartão cadastrado, o campo de fechamento global vira atalho pro cadastro. |
| `src/screens/gastos.jsx` | Segunda linha de chips filtrando por cartão, dentro do filtro de crédito. |
| `src/screens/recorrentes.jsx` | Seletor de cartão ao editar uma recorrência no crédito. |

## O que continua valendo

O saldo do mês **não muda**: segue por competência, a compra abate o mês em que
foi feita. Cartão é organização e leitura, não uma nova conta de saldo. Ver o
cabeçalho de `src/lib/fatura.js`.

## Ficou de fora, de propósito

1. **A meta mensal de gasto continua global** (`preferences.orcamentoCartaoCredito`,
   em Orçamentos). É um teto de quanto o usuário quer gastar no crédito no mês, e
   essa pergunta não muda por cartão — diferente do `limite`, que é o teto do
   banco e é por cartão.
2. **Cartão de débito não entra no cadastro.** Cartão cadastrado é quem tem
   fatura e ciclo; `"Cartão de débito"` segue etiqueta em `PAGAMENTOS`.
3. **Dia de vencimento separado do fechamento.** O app continua dizendo "vence
   no mês seguinte" sem dia exato. Só vale a pena com contagem de dias.
4. **A tela não entra no prefetch ocioso** do `app.jsx` — é secundária e o
   prefetch já carrega ~258 kB.
5. **Aviso de fatura grande perto da renda** — o buraco de caixa que a
   competência esconde. Continua pendente desde 2026-08-11.
