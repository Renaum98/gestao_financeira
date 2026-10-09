// BaixarDadosModal.jsx — escolha do período e exportação dos dados.
//
// Serve aos dois formatos: `.xlsx` (dados crus, mês a mês ou tudo) e `.pdf`
// (relatório formatado). O PDF é sempre de UM mês — a opção "Todos os dados"
// nem aparece nesse modo.

import { ModalOverlay } from "../../ui/modal-base.jsx";
import { rotuloMes } from "../../data.js";
import {
  Aviso,
  BotoesDialogo,
  IconeDialogo,
  LinhaOpcao,
  ListaAgrupada,
  RodapeLista,
  TituloDialogo,
} from "../../ui/form-lista.jsx";
import { COR_NEG } from "../../lib/colors.js";
import { useT } from "../../lib/i18n.jsx";

export function BaixarDadosModal({
  formato = "xlsx",
  mesSelecionado,
  onSelecionarMes,
  baixando,
  erro,
  todosMeses,
  onCancelar,
  onConfirmar,
}) {
  const t = useT();
  const ehPdf = formato === "pdf";
  // Sem mês com lançamento não há relatório possível. No .xlsx ainda sobra a
  // opção "Todos os dados", então só o PDF trava.
  const semOpcoes = ehPdf && todosMeses.length === 0;
  const podeBaixar = !baixando && !!mesSelecionado;
  // Durante o download não se fecha nada — nem por fora, nem pelo Esc.

  return (
    <ModalOverlay
      onClose={baixando ? undefined : onCancelar}
      maxWidth={400}
      padding="22px 20px 18px"
    >
      <IconeDialogo icone={ehPdf ? "file-text" : "list"} />
      <TituloDialogo
        titulo={ehPdf ? t("Baixar relatório") : t("Baixar dados")}
        mensagem={ehPdf
          ? t("Relatório em PDF com as transações do mês")
          : t("Arquivo .xlsx para abrir no Excel ou Google Sheets")}
      />

      {/* Os meses rolam dentro da lista; o pé com os botões fica no lugar. */}
      <ListaAgrupada style={{ marginTop: 14, maxHeight: 300, overflowY: "auto" }}>
        {!ehPdf && (
          <LinhaOpcao
            icone="sparkle"
            rotulo={t("Todos os dados")}
            legenda={t("Transações, caixinhas, recorrentes e orçamentos")}
            selecionado={mesSelecionado === "todos"}
            onClick={() => onSelecionarMes("todos")}
          />
        )}
        {todosMeses.map((m, i) => (
          <LinhaOpcao
            key={m}
            icone="calendar"
            rotulo={rotuloMes(m)}
            legenda={ehPdf ? t("Relatório deste mês") : t("Apenas transações deste mês")}
            selecionado={mesSelecionado === m}
            divisoria={!ehPdf || i > 0}
            onClick={() => onSelecionarMes(m)}
          />
        ))}
        {semOpcoes && (
          <div
            style={{
              padding: "20px 16px",
              textAlign: "center",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--muted)",
              lineHeight: 1.5,
            }}
          >
            {t("Você ainda não tem nenhum mês com transações lançadas.")}
          </div>
        )}
      </ListaAgrupada>

      {ehPdf && !semOpcoes && (
        <RodapeLista style={{ textAlign: "center" }}>{t("O relatório é sempre de um mês só.")}</RodapeLista>
      )}

      {erro && <Aviso icone="close" cor={COR_NEG}>{erro}</Aviso>}

      <BotoesDialogo
        cancelar={{ texto: t("Cancelar"), onClick: onCancelar, disabled: baixando }}
        confirmar={{ texto: baixando ? t("Gerando…") : t("Baixar"), onClick: onConfirmar, disabled: !podeBaixar }}
      />
    </ModalOverlay>
  );
}
