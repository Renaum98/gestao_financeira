// eslint.config.js — o revisor automático do projeto.
//
// O que ele faz que o build não faz: o `vite build` só quer saber se o código
// é JavaScript válido. Duas chaves iguais num objeto são válidas — a segunda
// vence e a primeira some sem aviso —, e foi assim que doze traduções
// duplicadas viveram no i18n-dict.js até alguém tropeçar nelas. `no-dupe-keys`
// pega isso na hora.
//
// O conjunto é pequeno de propósito. Num projeto que nunca teve linter, ligar
// tudo de uma vez enterra o que importa debaixo de centenas de avisos de
// estilo, e aí ninguém roda mais. Aqui só entram regras que apontam BUG:
// `recommended` do ESLint e as duas de hooks do React. Estilo (aspas, vírgula,
// indentação) fica de fora — isso é trabalho de formatador, não de linter.

import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  {
    // dist/ é gerado, node_modules não é nosso, e public/ tem service worker
    // escrito à mão, que roda noutro ambiente e com outras regras.
    ignores: ['dist/**', 'node_modules/**', 'public/**'],
  },

  js.configs.recommended,

  {
    // Sem `files`: vale pro projeto inteiro, inclusive os arquivos de config.
    // Duas afinações que não afrouxam a regra, só contam a ela dois idiomas
    // que o projeto usa de propósito:
    //
    // `ignoreRestSiblings` — extrair uma chave só pra deixá-la de fora do
    // resto (`const { saldoInicial, ...resto } = dados`) é a forma de omitir
    // um campo em JS. A variável nasce para não ser usada; sem isto a regra
    // acusa as quatro ocorrências do app.
    //
    // `allowEmptyCatch` — um `catch {}` vazio aqui é decisão, não esquecimento:
    // localStorage cheio ou bloqueado, e `git rev-parse` num tarball sem .git,
    // são falhas em que não fazer nada é a resposta certa. Onde havia o que
    // dizer, o catch diz.
    rules: {
      'no-unused-vars': ['error', { ignoreRestSiblings: true }],
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },

  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {

      // Hook chamado dentro de if/loop/callback. Não é questão de gosto: o
      // React identifica cada hook pela ORDEM da chamada, então um hook
      // condicional embaralha o estado de um render pro outro.
      'react-hooks/rules-of-hooks': 'error',

      // Dependência faltando num useEffect/useMemo. Fica em `warn`, e não em
      // `error`, porque aqui existe omissão proposital — o useSplashInteiro
      // (ui/loader.jsx) depende só de `apareceu` justamente pra que o fim da
      // carga não cancele o timer antes dele disparar, e isso está explicado
      // lá. Aviso pede que se olhe; erro obrigaria a "consertar" o que estava
      // certo.
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  {
    // Scripts de build rodam no Node, não no navegador.
    files: ['scripts/**/*.{js,mjs}', '*.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
  },
];
