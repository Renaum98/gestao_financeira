# MyCounts — o que o app faz

App de finanças pessoais para uso diário no celular. PWA instalável, dados sincronizados em tempo real, funciona offline e pode ser usado sozinho ou a dois.

**Stack:** React + Vite + Firebase (Auth + Firestore). Sem backend próprio — o app fala direto com o Firestore, e quem controla o acesso são as Security Rules.

---

## O dia a dia

**Transações** — gastos e entradas, com descrição, data, categoria e forma de pagamento. Dez categorias prontas (alimentação, transporte, moradia, lazer, saúde, compras, educação, assinaturas, financiamento, outros) e categorias personalizadas com nome e cor próprios.

**Parcelamento** — uma compra em N vezes vira N lançamentos ligados entre si. Apagar a compra apaga todas as parcelas.

**Recorrentes** — contas que se repetem todo mês são lançadas sozinhas nos meses seguintes. A tela de recorrentes mostra o que ainda não foi gerado, para cancelar ou seguir.

**Simulador de gasto** — antes de gastar, testa o impacto: quanto sobra do mês se este gasto entrar.

## Saldo do mês

O número principal do app segue uma fórmula explícita — orçamento fixo + entradas do mês − o que foi guardado em caixinhas, mais a sobra ou dívida herdada do mês anterior.

**Carrossel de meses** — o card de saldo desliza entre os meses, com o mês ativo sempre no centro.

**Virada de mês** — ao entrar num mês novo, o app oferece trazer a sobra (ou a dívida) do mês anterior. É opcional: quem não quiser carregar o resultado passado, não carrega.

**Card de insights** — observações geradas a partir dos próprios números do mês (categoria que mais cresceu, média por dia, comparação com o mês anterior), rotacionando a cada dez segundos. Só entra o insight que tem dados suficientes para existir.

## Orçamentos

Orçamento mensal geral e orçamento por categoria, com alerta de categoria estourando ou chegando ao limite.

**Histórico de vigência** — o ponto menos óbvio e o mais importante: cada mês guarda o orçamento que valia *naquele mês*. Quem toma um aumento e sobe o orçamento em agosto mantém julho com o valor antigo, e a projeção do ano soma os doze valores reais em vez de multiplicar o orçamento de hoje por doze.

## Cartões de crédito

Cadastro de cartões com cor, apelido e **dia de fechamento** próprio. O app mostra em qual fatura cada compra caiu e quando ela vence — comprei em agosto, pago com o salário de setembro.

A fatura é só leitura: o saldo do mês continua por competência, ou seja, a compra abate o mês em que foi feita. Nunca pedimos o número do cartão.

## Caixinhas (metas de poupança)

Metas com nome, cor, valor-alvo e prazo — ou sem meta nenhuma, para quem só quer ir juntando. Depósitos, saques e um tipo especial de **saldo inicial**, para dinheiro que já existia antes da caixinha e por isso não deve abater o saldo do mês.

**Rendimento projetado** — caixinhas marcadas como investimento projetam rendimento pela Meta Selic, buscada na API do Banco Central (série SGS 432), com cache de 24h e fallback quando a API está fora.

## Análise

Gráficos construídos à mão em SVG, sem biblioteca de charts:

- pizza de gastos por categoria
- evolução mês a mês
- evolução conjunta (você e o parceiro, em conta compartilhada)
- maiores gastos do mês
- gastos por forma de pagamento
- **projeção anual**, que segue o orçamento real de cada mês

## Conta compartilhada

Convite por e-mail, aceite pelo outro lado, e a partir daí os dois enxergam os gastos um do outro — com a autoria preservada em cada lançamento e nos gráficos. Desfazer o vínculo é possível dos dois lados.

## Notificações

Lembretes nativos de contas a vencer, no Chrome/Android e em PWAs instalados no iOS 16.4+. São **locais**, não push remoto: disparam quando o app abre e há pendência não avisada.

## Exportar

- **Planilha `.xlsx`** com os dados crus, para quem quer analisar por fora. A biblioteca é carregada sob demanda — só quem clica paga o custo no bundle.
- **Relatório mensal em PDF** formatado para ler, imprimir ou enviar: resumo do mês, tabela de transações e fechamento por categoria.

## Personalização

- **Tema** claro, escuro ou seguindo o sistema
- **7 paletas** de cor de destaque, todas calibradas por contraste (mais abaixo)
- **2 idiomas** — português e inglês, com 656 strings traduzidas
- **4 moedas** — BRL, USD, EUR e GBP. Muda símbolo e formato, sem conversão de câmbio

## Funciona offline

Cache persistente do Firestore: dá para lançar um gasto no metrô e ele sobe ao reconectar. Uma barra avisa quando o aparelho está sem conexão.

O caso difícil é o conflito: como cada coleção é um array e toda escrita manda o array inteiro, um aparelho que ficou offline reenviaria a lista como ele a conhecia e apagaria o que outro aparelho gravou no meio tempo. O app trata isso explicitamente, com a nuvem prevalecendo.

## Modo leve

Para aparelhos mais fracos, o app abre mão de enfeite em troca de quadros: o vidro da tab bar vira superfície sólida, o carrossel de meses vira card único, as transições encurtam. Automático, ligável ou desligável.

A regra de recorte é deliberada — só vira opção o que cobra preço do usuário. O que é conserto puro entra para todo mundo, sem virar chave.

## Desktop

O app não é uma tela de celular esticada: em telas largas ele muda de layout, com sidebar no lugar da tab bar e o padrão mestre-detalhe onde faz sentido. O corte é decidido em um único lugar, em JS, para que CSS e JS nunca discordem sobre o que é desktop.

---

## Decisões técnicas

O que este projeto tem de menos comum não são as telas, são as coisas que ele **não** usa.

**Dependências de runtime: seis.** React, React DOM, Firebase, jsPDF, xlsx e sheetjs. Não há router, biblioteca de UI, framework de CSS, biblioteca de gráficos nem gerenciador de estado.

| O de praxe | Aqui |
|---|---|
| React Router | navegação própria com pilha de telas |
| Redux / Zustand | estado no topo, em React puro |
| Tailwind / MUI | CSS escrito à mão, dividido por tema |
| Recharts / Chart.js | SVG construído à mão |

**Carregamento sob demanda.** Quatorze telas e modais entram por `React.lazy`, e as mais prováveis são pré-carregadas quando o navegador está ocioso — chegam prontas sem pesar a abertura. Bundle inicial: 520 kB, 158 kB comprimido.

**Cores calibradas, não escolhidas.** Cada paleta foi medida em OKLCH e ajustada por contraste WCAG nos três papéis que a cor exerce — texto sobre o card claro, fundo sob texto branco, e legibilidade contra o fundo escuro. O motivo de cada tom está escrito ao lado dele no código, para que ninguém "conserte" de volta um valor que era intencional.

**Autenticação em camadas.** Login por e-mail e senha com verificação de e-mail, mais três defesas independentes: trava progressiva no formulário, honeypot contra preenchimento automático, e Firebase App Check para o que tenta falar direto com a API sem passar pela tela. Cada camada cobre o que a outra não alcança, e isso está documentado no código.

**Comentários que explicam o porquê.** O código registra a razão das decisões, não o que a linha faz. Números que parecem arbitrários — uma parada de gradiente, um atraso de animação, um tom de amarelo — vêm com a medição que os produziu.

---

## Rodando

```bash
npm install
npm run dev
```

Precisa de um projeto Firebase configurado (Auth com e-mail/senha + Firestore). O passo a passo está no [README](README.md).

Para entender o código por dentro, o [Guia do Projeto](GUIA-DO-PROJETO.md) explica o app de ponta a ponta.
