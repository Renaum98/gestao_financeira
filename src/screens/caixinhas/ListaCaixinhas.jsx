// ListaCaixinhas.jsx — tela com a lista de caixinhas e o botão de criar.

import React from "react";
import { Icon } from "../../ui/icons.jsx";
import { Card, TopBar } from "../../ui/common.jsx";
import { CardCaixinha } from "./CardCaixinha.jsx";
import { ModalCaixinha } from "./ModalCaixinha.jsx";

export function CaixinhasScreen({ ctx }) {
  const { caixinhas, salvarCaixinha, voltar, irPara, ocultar, ehDesktop } = ctx;
  const [modal, setModal] = React.useState(null); // null | 'nova' | { editando: caixinha }

  return (
    <div style={{ paddingBottom: "var(--pad-bottom)" }}>
      <TopBar voltar={ehDesktop ? undefined : voltar} titulo="Caixinhas" />

      <div style={{ padding: "4px 20px 0" }}>
        {caixinhas.length === 0 ? (
          <Card style={{ padding: 28, textAlign: "center" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                background: "linear-gradient(135deg, var(--primary), var(--primary-2))",
                margin: "0 auto 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="piggy" size={26} color="#fff" strokeWidth={2.2} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>
              Sem caixinhas ainda
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
              Crie uma caixinha para juntar dinheiro com um objetivo (viagem, reserva, presente…). A
              meta é opcional.
            </div>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {caixinhas.map((cx) => (
              <CardCaixinha
                key={cx.id}
                cx={cx}
                ocultar={ocultar}
                onClick={() => irPara("caixinha", { id: cx.id })}
              />
            ))}
          </div>
        )}

        <button
          onClick={() => setModal("nova")}
          style={{
            width: "100%",
            marginTop: 16,
            padding: "14px",
            borderRadius: 16,
            border: "none",
            cursor: "pointer",
            background: "linear-gradient(135deg, var(--primary), var(--primary-2))",
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
          Nova caixinha
        </button>
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
