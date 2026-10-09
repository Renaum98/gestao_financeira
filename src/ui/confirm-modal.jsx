// confirm-modal.jsx — Modal de confirmação reutilizável (destrutivo por padrão).

import { ModalOverlay } from './modal-base.jsx';
import { BotoesDialogo, IconeDialogo, TituloDialogo } from './form-lista.jsx';
import { COR_NEG, COR_NEG_FUNDO } from '../lib/colors.js';
import { useT } from '../lib/i18n.jsx';

export function ConfirmModal({
  titulo,
  mensagem,
  textoConfirmar = 'Excluir',
  textoCancelar = 'Cancelar',
  icone = 'trash',
  destrutivo = true,
  onConfirmar,
  onCancelar,
  // Conteúdo extra entre a mensagem e os botões (ex.: uma escolha).
  children,
}) {
  const t = useT();
  const corAcao = destrutivo ? COR_NEG : 'var(--primary)';

  return (
    <ModalOverlay
      onClose={onCancelar}
      maxWidth={360}
      padding="22px 20px 18px"
      scrollable={false}
      center
    >
      <IconeDialogo icone={icone} cor={corAcao} fundo={destrutivo ? COR_NEG_FUNDO : undefined} />
      <TituloDialogo titulo={titulo} mensagem={mensagem} />

      {children}

      <BotoesDialogo
        cancelar={{ texto: t(textoCancelar), onClick: onCancelar }}
        confirmar={{ texto: t(textoConfirmar), onClick: onConfirmar, cor: corAcao }}
      />
    </ModalOverlay>
  );
}
