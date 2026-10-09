// ConvidarParceiroModal.jsx — fluxo de convite de parceiro: explicação →
// e-mail → sucesso.

import React from "react";
import { ModalOverlay } from "../../ui/modal-base.jsx";
import { Icon } from "../../ui/icons.jsx";
import {
  Aviso,
  BotoesDialogo,
  IconeDialogo,
  Linha,
  ListaAgrupada,
  RodapeLista,
  TituloDialogo,
  estiloInputLinha,
} from "../../ui/form-lista.jsx";
import { vibrar } from "../../lib/haptics.js";
import { convidarPorEmail } from "../../lib/partnership.js";
import { COR_POS, COR_NEG } from "../../lib/colors.js";
import { useT } from "../../lib/i18n.jsx";

function ExplicacaoConta({ onContinuar, onCancelar }) {
  const t = useT();
  const itens = [
    { icon: "eye", texto: t("Vocês veem os gastos um do outro (sem editar).") },
    { icon: "piggy", texto: t("Caixinhas viram compartilhadas — ambos editam.") },
    { icon: "close", texto: t("Dá pra desfazer; quem desfaz leva as caixinhas.") },
  ];
  return (
    <div>
      <ListaAgrupada style={{ marginTop: 14 }}>
        {itens.map((it, i) => (
          <Linha
            key={it.icon}
            divisoria={i > 0}
            inicio={<Icon name={it.icon} size={17} color="var(--primary)" strokeWidth={2.3} />}
          >
            <span style={{ flex: 1, fontSize: 12.5, color: "var(--ink)", fontWeight: 600, lineHeight: 1.35 }}>
              {it.texto}
            </span>
          </Linha>
        ))}
      </ListaAgrupada>

      <RodapeLista style={{ textAlign: "center" }}>
        {t("Só entre ")}<strong style={{ color: "var(--ink)" }}>{t("2 pessoas")}</strong>{t(". Pra trocar, desfaça a parceria atual antes.")}
      </RodapeLista>

      <BotoesDialogo
        cancelar={{ texto: t("Cancelar"), onClick: onCancelar }}
        confirmar={{ texto: t("Continuar"), onClick: onContinuar }}
      />
    </div>
  );
}

export function ConvidarParceiroModal({ meuUid, meuNome, meuEmail, onFechar }) {
  const t = useT();
  const [etapa, setEtapa] = React.useState("explicacao"); // 'explicacao' | 'email' | 'sucesso'
  const [email, setEmail] = React.useState("");
  const [erro, setErro] = React.useState("");
  const [enviando, setEnviando] = React.useState(false);
  const sucesso = etapa === "sucesso";

  const enviar = async (e) => {
    e?.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      await convidarPorEmail({ meuUid, meuNome, meuEmail, emailParceiro: email });
      vibrar(14);
      setEtapa("sucesso");
      setTimeout(onFechar, 1400);
    } catch (err) {
      setErro(err?.message || t("Não foi possível enviar o convite."));
      setEnviando(false);
    }
  };

  return (
    <ModalOverlay
      onClose={enviando ? undefined : onFechar}
      maxWidth={400}
      padding="22px 20px 18px"
    >
      <form onSubmit={enviar}>
        <IconeDialogo icone={sucesso ? "check" : "user"} cor={sucesso ? COR_POS : undefined} />

        {etapa === "explicacao" ? (
          <>
            <TituloDialogo
              titulo={t("Conta compartilhada")}
              mensagem={
                <>
                  {t("Pensada pra ")}<strong style={{ color: "var(--ink)" }}>{t("dois usuários")}</strong>{t(" (ex: casal) acompanharem os gastos um do outro e juntarem dinheiro pra metas comuns.")}
                </>
              }
            />
            <ExplicacaoConta onContinuar={() => setEtapa("email")} onCancelar={onFechar} />
          </>
        ) : sucesso ? (
          <TituloDialogo
            titulo={t("Convite enviado!")}
            mensagem={t("Aguarde a resposta nas notificações.")}
          />
        ) : (
          <>
            <TituloDialogo
              titulo={t("Convidar parceiro")}
              mensagem={t("Ele(a) precisa já ter conta no app.")}
            />
            <ListaAgrupada style={{ marginTop: 14 }}>
              <Linha icone="mail" as="label">
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="parceiro@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={enviando}
                  aria-label={t("E-mail do parceiro")}
                  style={estiloInputLinha}
                />
              </Linha>
            </ListaAgrupada>

            {erro && <Aviso icone="close" cor={COR_NEG}>{erro}</Aviso>}

            <BotoesDialogo
              cancelar={{ texto: t("Cancelar"), onClick: onFechar, disabled: enviando }}
              confirmar={{
                texto: enviando ? t("Enviando…") : t("Enviar convite"),
                type: "submit",
                disabled: enviando || !email.trim(),
              }}
            />
          </>
        )}
      </form>
    </ModalOverlay>
  );
}
