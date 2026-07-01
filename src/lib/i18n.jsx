// i18n.jsx — núcleo de internacionalização do app.
//
// Estratégia: a própria string em português é a "chave". `t("Sair da conta")`
// procura a tradução no dicionário do idioma ativo e, se não encontrar (ou se o
// idioma for "pt"), devolve a string original. Isso torna a migração segura e
// incremental: textos ainda não traduzidos simplesmente continuam em português,
// sem quebrar nada.
//
// O idioma vem de `preferences.idioma` (sincronizado na nuvem). Como login e
// onboarding rodam antes dos dados carregarem, espelhamos a escolha no
// localStorage pra ter o idioma certo já na abertura.

import React from "react";
import { EN } from "./i18n-dict.js";

const DICIONARIOS = { en: EN };
const STORAGE_KEY = "idioma";

export const IDIOMAS_SUPORTADOS = ["pt", "en"];

export function lerIdiomaSalvo() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return IDIOMAS_SUPORTADOS.includes(v) ? v : null;
  } catch {
    return null;
  }
}

export function salvarIdioma(lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* localStorage indisponível (modo privado) — ignora */
  }
}

export const I18nContext = React.createContext("pt");

export function I18nProvider({ lang, children }) {
  const valor = IDIOMAS_SUPORTADOS.includes(lang) ? lang : "pt";
  return <I18nContext.Provider value={valor}>{children}</I18nContext.Provider>;
}

// Tradução pura (sem React). Aceita interpolação via {chave}:
//   traduzir("en", "Olá, {nome}", { nome: "Ana" })
export function traduzir(lang, texto, vars) {
  let saida = texto;
  if (lang && lang !== "pt") {
    const dic = DICIONARIOS[lang];
    if (dic && dic[texto] != null) saida = dic[texto];
  }
  if (vars) {
    for (const chave in vars) {
      saida = saida.split(`{${chave}}`).join(String(vars[chave]));
    }
  }
  return saida;
}

// Hook principal: devolve a função `t` já amarrada ao idioma ativo.
export function useT() {
  const lang = React.useContext(I18nContext);
  return React.useCallback((texto, vars) => traduzir(lang, texto, vars), [lang]);
}

export function useIdioma() {
  return React.useContext(I18nContext);
}
