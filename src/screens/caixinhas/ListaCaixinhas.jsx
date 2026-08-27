// ListaCaixinhas.jsx — tela com a lista de caixinhas e o botão de criar.

import React from "react";
import { Icon } from "../../ui/icons.jsx";
import { Card, TopBar } from "../../ui/common.jsx";
import { CardCaixinha } from "./CardCaixinha.jsx";
import { ModalCaixinha } from "./ModalCaixinha.jsx";
import { useT } from "../../lib/i18n.jsx";

// `params` só chega quando a lista está servindo de mestre ao lado do detalhe
// (desktop): é o que permite marcar qual caixinha está aberta. Na navegação
// normal ela vem vazia e nenhuma fica marcada.
export function CaixinhasScreen({ ctx, params }) {
  const { caixinhas, salvarCaixinha, voltar, irPara, ehDesktop } = ctx;
  const t = useT();
  const [modal, setModal] = React.useState(null); // null | 'nova' | { editando: caixinha }

  return (
    <div style={{ paddingBottom: "var(--pad-bottom)" }}>
      <TopBar voltar={ehDesktop ? undefined : voltar} titulo={t("Caixinhas")} />

      <div style={{ padding: "4px var(--pad-x) 0" }}>
        {caixinhas.length === 0 ? (
          // Sem caixinhas o convite fica numa coluna estreita: esticado por mil
          // pixels ele viraria uma faixa vazia.
          <div className="coluna-estreita">
          <Card style={{ padding: 28, textAlign: "center" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                background: "var(--primary-degrade)",
                margin: "0 auto 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="piggy" size={26} color="#fff" strokeWidth={2.2} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>
              {t("Sem caixinhas ainda")}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--muted)",
                fontWeight: 500,
                marginTop: 6,
                lineHeight: 1.4,
              }}
            >
              {t("Crie uma caixinha para juntar dinheiro com um objetivo (viagem, reserva, presente…). A meta é opcional.")}
            </div>
          </Card>
          </div>
        ) : (
          // Cada caixinha é um bloco fechado em si — no desktop cabem várias
          // por linha sem que nenhuma precise saber disso.
          <div className="grade-tiles">
            {caixinhas.map((cx) => (
              <CardCaixinha
                key={cx.id}
                cx={cx}
                selecionada={cx.id === params?.id}
                onClick={() => irPara("caixinha", { id: cx.id })}
              />
            ))}
          </div>
        )}

        <div className="coluna-estreita">
        <button
          onClick={() => setModal("nova")}
          style={{
            width: "100%",
            marginTop: 16,
            padding: "14px",
            borderRadius: 16,
            border: "none",
            cursor: "pointer",
            background: "var(--primary-degrade)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 800,
            fontFamily: "inherit",
            boxShadow: "0 6px 16px color-mix(in oklab, var(--primary) 30%, transparent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Icon name="plus" size={18} color="#fff" strokeWidth={2.6} />
          {t("Nova caixinha")}
        </button>
        </div>
      </div>

      {modal && (
        <ModalCaixinha
          editando={modal === "nova" ? null : modal.editando}
          onFechar={() => setModal(null)}
          onSalvar={(dados) => {
            salvarCaixinha(dados);
            setModal(null);
          }}
        />
      )}
    </div>
  );
}
