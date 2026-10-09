// ModalApagarCartao.jsx — confirma a exclusão e pergunta pra onde vão os
// lançamentos presos ao cartão.
//
// Apagar cartão é a única forma de gerar tx órfã (sem `cartaoId` com outros
// cartões cadastrados), então a pergunta é obrigatória: some o destino e o
// histórico do usuário muda de lugar sem ele saber. Com um cartão só, não há o
// que perguntar — os lançamentos voltam a ser "crédito" genérico, que é
// exatamente o app de antes do cadastro.

import React from "react";
import { ModalOverlay } from "../../ui/modal-base.jsx";
import { Icon } from "../../ui/icons.jsx";
import {
  BotoesDialogo,
  IconeDialogo,
  LinhaOpcao,
  ListaAgrupada,
  TituloDialogo,
} from "../../ui/form-lista.jsx";
import { COR_NEG, COR_NEG_FUNDO } from "../../lib/colors.js";
import { corDoCartao, corTextoSobre } from "../../lib/cartoes.js";
import { vibrar } from "../../lib/haptics.js";
import { useT } from "../../lib/i18n.jsx";

// O quadradinho do cartão no começo da linha, na cor dele.
function MiniCartao({ cor }) {
  return (
    <span
      style={{
        width: 26,
        height: 26,
        borderRadius: "var(--raio-compacto)",
        background: cor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Icon name="card" size={14} color={corTextoSobre(cor)} strokeWidth={2.2} />
    </span>
  );
}

export function ModalApagarCartao({ cartao, outros, quantidade, onFechar, onConfirmar }) {
  const t = useT();
  const [destino, setDestino] = React.useState(outros[0]?.id ?? null);
  const temLancamentos = quantidade > 0;
  const escolher = (id) => { vibrar(); setDestino(id); };

  return (
    <ModalOverlay onClose={onFechar} maxWidth={400} padding="22px 20px 18px">
      <IconeDialogo icone="trash" cor={COR_NEG} fundo={COR_NEG_FUNDO} />
      <TituloDialogo
        titulo={t("Apagar {nome}?", { nome: cartao.nome })}
        mensagem={!temLancamentos
          ? t("Nenhum lançamento está preso a este cartão.")
          : outros.length === 0
            ? t("{n} lançamentos estão neste cartão. Eles continuam no histórico como crédito, sem cartão — nada é apagado e nenhum valor muda.", { n: quantidade })
            : t("{n} lançamentos estão neste cartão. Escolha pra onde eles vão — nada é apagado e nenhum valor muda.", { n: quantidade })}
      />

      {temLancamentos && outros.length > 0 && (
        <ListaAgrupada style={{ marginTop: 14 }}>
          {outros.map((c, i) => (
            <LinhaOpcao
              key={c.id}
              inicio={<MiniCartao cor={corDoCartao(c)} />}
              rotulo={t("Mover para {nome}", { nome: c.nome })}
              selecionado={destino === c.id}
              divisoria={i > 0}
              onClick={() => escolher(c.id)}
            />
          ))}
          <LinhaOpcao
            inicio={<MiniCartao cor="var(--muted)" />}
            rotulo={t("Deixar sem cartão")}
            legenda={t("Continuam como crédito, sem cartão definido")}
            selecionado={destino === null}
            divisoria
            onClick={() => escolher(null)}
          />
        </ListaAgrupada>
      )}

      <BotoesDialogo
        cancelar={{ texto: t("Cancelar"), onClick: onFechar }}
        confirmar={{
          texto: t("Apagar"),
          onClick: () => onConfirmar(outros.length > 0 ? destino : null),
          cor: COR_NEG,
        }}
      />
    </ModalOverlay>
  );
}
