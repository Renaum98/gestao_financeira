// ExcluirContaModal.jsx — exclusão permanente da conta, com reautenticação por
// senha quando o Firebase exige login recente.

import React from "react";
import { ModalOverlay } from "../../ui/modal-base.jsx";
import {
  Aviso,
  BotoesDialogo,
  IconeDialogo,
  Linha,
  ListaAgrupada,
  TituloDialogo,
  estiloInputLinha,
} from "../../ui/form-lista.jsx";
import { reautenticarComSenha } from "../../lib/firebase.js";
import { excluirContaCompleta, precisaReautenticar } from "../../lib/account.js";
import { Loader } from "../../ui/loader.jsx";
import { COR_NEG, COR_NEG_FUNDO } from "../../lib/colors.js";
import { useT } from "../../lib/i18n.jsx";

export function ExcluirContaModal({ uid, meuEmail, meuNome, partnershipId, onFechar }) {
  const t = useT();
  // 'aviso'    → tela inicial com a confirmação textual
  // 'senha'    → pedindo senha (reautenticação)
  // 'apagando' → spinner
  const [etapa, setEtapa] = React.useState("aviso");
  const [senha, setSenha] = React.useState("");
  const [erro, setErro] = React.useState("");

  const tentarExcluir = async () => {
    setErro("");
    setEtapa("apagando");
    try {
      await excluirContaCompleta({ uid, meuEmail, meuNome, partnershipId });
      // O onAuthStateChanged dispara → o app vai pra LoginScreen sozinho.
    } catch (err) {
      if (precisaReautenticar(err)) {
        setEtapa("senha");
      } else {
        setErro(err?.message || t("Não foi possível excluir a conta."));
        setEtapa("aviso");
      }
    }
  };

  const confirmarSenha = async (e) => {
    e?.preventDefault();
    setErro("");
    if (!senha) {
      setErro(t("Digite sua senha."));
      return;
    }
    setEtapa("apagando");
    try {
      await reautenticarComSenha(senha);
      await excluirContaCompleta({ uid, meuEmail, meuNome, partnershipId });
    } catch (err) {
      const cod = err?.code;
      if (cod === "auth/wrong-password" || cod === "auth/invalid-credential") {
        setErro(t("Senha incorreta."));
      } else {
        setErro(err?.message || t("Não foi possível excluir a conta."));
      }
      setEtapa("senha");
    }
  };

  const apagando = etapa === "apagando";

  return (
    <ModalOverlay
      onClose={apagando ? undefined : onFechar}
      maxWidth={380}
      padding="22px 20px 18px"
    >
      <form onSubmit={etapa === "senha" ? confirmarSenha : (e) => e.preventDefault()}>
        <IconeDialogo icone="trash" cor={COR_NEG} fundo={COR_NEG_FUNDO} />

        {etapa === "aviso" && (
          <>
            <TituloDialogo
              titulo={t("Excluir sua conta?")}
              mensagem={
                <>
                  {t("Essa ação é ")}<strong style={{ color: "var(--ink)" }}>{t("irreversível")}</strong>{t(". Todos os seus dados (gastos, caixinhas, orçamentos, recorrentes) serão apagados permanentemente da nuvem.")}
                </>
              }
            />
            {partnershipId && (
              <Aviso icone="user">
                {t("Você está em uma conta compartilhada — seu parceiro receberá uma notificação avisando que você saiu, e as caixinhas dele serão limpas.")}
              </Aviso>
            )}
            {erro && <Aviso icone="close" cor={COR_NEG}>{erro}</Aviso>}
            <BotoesDialogo
              cancelar={{ texto: t("Cancelar"), onClick: onFechar }}
              confirmar={{ texto: t("Excluir"), onClick: tentarExcluir, cor: COR_NEG }}
            />
          </>
        )}

        {etapa === "senha" && (
          <>
            <TituloDialogo
              titulo={t("Excluir sua conta?")}
              mensagem={t("Por segurança, digite sua senha pra confirmar a exclusão.")}
            />
            <ListaAgrupada style={{ marginTop: 14 }}>
              <Linha icone="lock" as="label">
                <input
                  type="password"
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder={t("Sua senha")}
                  aria-label={t("Senha")}
                  style={estiloInputLinha}
                />
              </Linha>
            </ListaAgrupada>
            {erro && <Aviso icone="close" cor={COR_NEG}>{erro}</Aviso>}
            <BotoesDialogo
              cancelar={{ texto: t("Cancelar"), onClick: onFechar }}
              confirmar={{ texto: t("Confirmar exclusão"), type: "submit", cor: COR_NEG }}
            />
          </>
        )}

        {apagando && (
          <>
            <TituloDialogo titulo={t("Excluir sua conta?")} />
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <Loader size={44} label={t("Apagando seus dados")} />
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>{t("Apagando seus dados…")}</div>
            </div>
          </>
        )}
      </form>
    </ModalOverlay>
  );
}
