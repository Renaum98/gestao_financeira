// app-check.js — atestado de que a requisição veio do nosso app.
//
// As travas que vivem na tela (rate-limit-auth.js, honeypot no formulário) só
// pegam quem passa pela tela. Um script que fala direto com a API REST do
// Firebase Auth não vê nada disso: ele manda POST em signUp com um e-mail novo
// e ganha uma conta, quantas vezes quiser. As Security Rules seguram o estrago
// (sem e-mail confirmado ele não grava nada), mas não impedem a enxurrada.
//
// O App Check é a peça que falta: o SDK resolve um desafio de reCAPTCHA v3 no
// navegador e anexa um token a cada chamada do Firebase. Requisição sem token
// válido é recusada pelo back-end — antes de chegar nas rules, antes de contar
// cota. Como o desafio roda no navegador de verdade, um script fora dele não
// consegue produzir o token.
//
// ─── O que precisa ser feito no Console (uma vez) ──────────────────────────
//   1. Console do Firebase → App Check → Apps → registra o app Web com o
//      provedor "reCAPTCHA v3". Ele gera uma chave de site.
//   2. Põe a chave no .env como VITE_FIREBASE_APPCHECK_KEY e publica de novo
//      (na Vercel, também nas Environment Variables do projeto).
//   3. Deixa rodando alguns dias com a métrica em "Não aplicado" e acompanha em
//      App Check → APIs: quando as requisições verificadas forem a maioria,
//      liga o "Aplicar" no Cloud Firestore e no Authentication.
//
// Enquanto a chave não existir, este módulo não faz nada e o app funciona
// exatamente como antes — configurar pela metade não pode derrubar ninguém.

import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const CHAVE = import.meta.env.VITE_FIREBASE_APPCHECK_KEY;
// Em dev o reCAPTCHA não roda: usa-se um token de depuração, registrado em
// App Check → Apps → "Gerenciar tokens de depuração". Precisa ser definido
// ANTES do initializeAppCheck, senão o SDK já resolveu o provedor e ignora.
//
// Dois valores possíveis, e a diferença importa. `true` faz o SDK gerar um
// token novo e imprimir no console do navegador — é assim que se obtém o
// primeiro, pra colar no Console. Uma string é usada como o token em si, pra
// quem já registrou o dele. Variável de ambiente chega sempre como string, daí
// a conversão: sem ela, o literal "true" viraria um token inválido.
const BRUTO = import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN;
const TOKEN_DEBUG = BRUTO === "true" ? true : BRUTO;

export function iniciarAppCheck(app) {
  if (!CHAVE) return null;
  try {
    if (TOKEN_DEBUG) self.FIREBASE_APPCHECK_DEBUG_TOKEN = TOKEN_DEBUG;
    return initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(CHAVE),
      // Renova o token sozinho antes de vencer; sem isso a sessão longa (o PWA
      // fica aberto por dias) começaria a levar recusa do nada.
      isTokenAutoRefreshEnabled: true,
    });
  } catch (err) {
    // Chave errada ou domínio não autorizado. Não derrubamos o app: sem App
    // Check ele volta ao comportamento anterior, e o erro fica no console pra
    // aparecer no primeiro teste em vez de virar um mistério em produção.
    console.error("[App Check] não inicializou:", err);
    return null;
  }
}
