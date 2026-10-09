// ContaProximaModal.jsx — modal acionado ao tocar numa conta de "Próximas a
// vencer", permitindo marcá-la como paga.

import { CATEGORIAS, fmtBRL } from "../../data.js";
import { ModalOverlay } from "../../ui/modal-base.jsx";
import {
  BotoesDialogo,
  IconeDialogo,
  Linha,
  ListaAgrupada,
  TituloDialogo,
  estiloValorLinha,
} from "../../ui/form-lista.jsx";
import { COR_POS } from "../../lib/colors.js";
import { useT } from "../../lib/i18n.jsx";

export function ContaProximaModal({ tx, onFechar, onMarcarPago }) {
  const t = useT();
  const [, mm, dd] = tx.data.split("-").map(Number);
  const cat = CATEGORIAS[tx.categoria] || CATEGORIAS.outros;
  const diasAte = Math.ceil(
    (new Date(tx.data + "T12:00:00") - new Date()) / (1000 * 60 * 60 * 24),
  );
  const rotuloPrazo =
    diasAte <= 0
      ? t("Vence hoje")
      : diasAte === 1
        ? t("Vence amanhã")
        : t("Vence em {n} dias", { n: diasAte });

  return (
    <ModalOverlay
      onClose={onFechar}
      maxWidth={380}
      scrollable={false}
      center
      padding="22px 20px 18px"
    >
      <IconeDialogo icone="calendar" />
      <TituloDialogo
        titulo={tx.descricao}
        mensagem={`${dd}/${String(mm).padStart(2, "0")} · ${t(cat.nome)}`}
      />

      <ListaAgrupada style={{ marginTop: 14 }}>
        <Linha icone="wallet" rotulo={t("Valor")}>
          <span style={{ ...estiloValorLinha, fontSize: 16, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
            {fmtBRL(tx.valor)}
          </span>
        </Linha>
        <Linha icone="bell" rotulo={t("Prazo")} divisoria>
          <span style={estiloValorLinha}>{rotuloPrazo}</span>
        </Linha>
      </ListaAgrupada>

      <BotoesDialogo
        cancelar={{ texto: t("Fechar"), onClick: onFechar }}
        confirmar={{ texto: t("Marcar como pago"), onClick: onMarcarPago, cor: COR_POS, icone: "check" }}
      />
    </ModalOverlay>
  );
}
