# Plano — cadastro de cartões

Status: **não implementado**. Anotado em 2026-08-11, depois do ciclo de fatura
(branch `fatura-cartao`). Este doc é o ponto de partida da próxima sessão.

## O que se quer

Cadastrar mais de um cartão de crédito, cada um com **nome** e **bandeira**.
Hoje só existe uma etiqueta genérica `"Cartão de crédito"` e um único dia de
fechamento global.

**Não guardar o número do cartão.** Decisão explícita do usuário. A bandeira é
escolhida de uma lista, não deduzida de dígito nenhum — assim não passa número
de cartão pelo app nem pelo Firestore em momento algum. Se um dia fizer falta
distinguir dois cartões da mesma bandeira, um apelido resolve; os 4 últimos
dígitos só entram se o usuário pedir.

## Modelo de dados

Novo array no state, sincronizado igual a `caixinhas`/`recorrentes`:

```js
cartoes: [
  { id, nome: "Nubank", bandeira: "master", diaFechamento: 25, cor?: "#..." }
]
```

- `bandeira`: id de uma lista fixa (`visa`, `master`, `elo`, `amex`, `hipercard`,
  `outra`), com ícone/cor próprios — mesmo padrão de `CATEGORIAS` em `data.js`.
- `diaFechamento`: generaliza `preferences.diaFechamentoCartao` (0 = último dia
  do mês). A preferência global vira o padrão de quem não tem cartão cadastrado.

Na transação, um campo novo e **opcional**:

```js
{ ..., pagamento: "Cartão de crédito", cartaoId: "abc" | null }
```

## Migração — o ponto sensível

`pagamento` é uma string solta (`PAGAMENTOS` em `src/data.js`), usada como
etiqueta no modal de gasto, como filtro em Transações e como chave do limite do
cartão em Orçamentos. Tudo que já foi lançado fica sem `cartaoId`.

Regra: **`cartaoId` ausente continua funcionando como hoje.** Nada de migração
destrutiva nem de backfill adivinhando cartão. Na prática:

- `pagamento === "Cartão de crédito"` segue sendo o que define "isso é cartão".
- `cartaoId` só refina *qual* cartão.
- Telas que agrupam por cartão mostram um grupo "Sem cartão" para as antigas.

## O que muda em cada lugar

| Arquivo | Mudança |
|---|---|
| `src/lib/fatura.js` | `totalFatura`/`faturasEmAberto` passam a receber um cartão (ou `null` = todos). O ciclo em si não muda. |
| `src/modals/add-expense.jsx` | Ao escolher "Cartão de crédito", seletor de qual cartão. Com 0 cartões cadastrados, some (comportamento de hoje). O aviso "entra na fatura de X" usa o fechamento do cartão escolhido. |
| `src/screens/dashboard/FaturaCartao.jsx` | Uma linha de fatura por cartão em vez de uma só. Com 1 cartão, idêntico a hoje. |
| `src/screens/orcamentos.jsx` | O campo de fechamento global sai daqui e vai pro cadastro de cada cartão. O limite do cartão pode virar por cartão — **decidir na hora**, talvez continue global. |
| `src/screens/gastos.jsx` | Filtro por cartão além do filtro por forma de pagamento. |
| `src/lib/compact.js`, `src/lib/storage.js` | `cartoes` entra em `SYNCED_KEYS` + compactação; `cartaoId` preservado no compactar de tx. |
| Tela nova | CRUD de cartões (espelhar a de Caixinhas, que é o CRUD mais próximo). |

## O que continua valendo

O saldo do mês **não muda**: segue por competência, a compra abate o mês em que
foi feita. Cartão é organização e leitura, não uma nova conta de saldo. Ver o
cabeçalho de `src/lib/fatura.js`.

## Decisões que ficaram em aberto

1. Limite de gasto: continua global (`orcamentoCartaoCredito`) ou vira por cartão?
2. Dia de **vencimento** separado do fechamento? Hoje o app assume "vence no mês
   seguinte" sem dia exato. Só vale a pena se for mostrar contagem de dias.
3. Cartão de débito também vira cadastro, ou só crédito (que é quem tem fatura)?
