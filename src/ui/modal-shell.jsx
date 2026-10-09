// modal-shell.jsx — casca dos modais de cadastro (caixinha, cartão, depósito,
// resgate): o ModalOverlay com o cabeçalho Cancelar · Título · Salvar. O
// conteúdo segue as peças de ui/form-lista.jsx.

import { ModalOverlay } from "./modal-base.jsx";
import { CabecalhoForm } from "./form-lista.jsx";

// `corAcentoTexto` existe porque um acento claro (cartão amarelo, por exemplo)
// engole o branco. Só quem passa uma cor clara precisa informar.
export function ModalShell({ titulo, onFechar, onSalvar, salvarAtivo, corAcento, corAcentoTexto, children }) {
  return (
    <ModalOverlay
      onClose={onFechar}
      maxWidth={440}
      padding="14px 18px 20px"
      dialogStyle={{ overflowX: "hidden" }}
    >
      <CabecalhoForm
        titulo={titulo}
        onCancelar={onFechar}
        onSalvar={onSalvar}
        salvarAtivo={salvarAtivo}
        corSalvar={corAcento}
        corSalvarTexto={corAcentoTexto}
      />
      {children}
    </ModalOverlay>
  );
}
