// NotifParceriaItem.jsx — item de evento da parceria (aceite, depósito, etc.),
// com botão "Entendi" para dispensar.

import React from 'react';
import { MESES_CURTO, fmtBRL } from '../../data.js';
import { Icon } from '../../ui/icons.jsx';
import { COR_POS, COR_NEG } from '../../lib/colors.js';
import { useT } from '../../lib/i18n.jsx';

// Configuração visual por tipo de notificação de parceria.
function configNotif(notif, t) {
  switch (notif.tipo) {
    case "parceria-aceita":
      return {
        cor: COR_POS,
        titulo: (
          <>
            <strong>{notif.por}</strong>{t(' aceitou seu convite!')}
          </>
        ),
        subtitulo: t('Conta compartilhada ativada.'),
      };
    case "caixinha-criada":
      return {
        cor: "var(--primary)",
        titulo: (
          <>
            <strong>{notif.por}</strong>{t(' criou uma caixinha')}
          </>
        ),
        subtitulo: notif.caixinhaNome ? `"${notif.caixinhaNome}"` : null,
      };
    case "caixinha-deposito":
      return {
        cor: COR_POS,
        titulo: (
          <>
            <strong>{notif.por}</strong>{t(' depositou {x}', { x: fmtBRL(notif.valor || 0) })}
          </>
        ),
        subtitulo: notif.caixinhaNome ? t('Na caixinha "{nome}"', { nome: notif.caixinhaNome }) : null,
      };
    case "parceria-desfeita":
    default:
      return {
        cor: COR_NEG,
        titulo: (
          <>
            <strong>{notif.por}</strong>{t(' desfez a conta compartilhada')}
          </>
        ),
        subtitulo: null,
      };
  }
}

export function NotifParceriaItem({ notif, primeiro, onDispensar }) {
  const t = useT();
  const cfg = configNotif(notif, t);
  const formatarData = (iso) => {
    try {
      const d = new Date(iso);
      const dn = t(['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.getDay()]);
      return `${dn}, ${d.getDate()} ${t(MESES_CURTO[d.getMonth()])} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch {
      return "";
    }
  };

  return (
    <div
      style={{
        padding: "14px 0",
        borderTop: primeiro ? "none" : "1px solid var(--linha)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: `color-mix(in oklab, ${cfg.cor} 14%, transparent)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon name={cfg.icone} size={22} color={cfg.cor} strokeWidth={2.4} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--ink)",
              lineHeight: 1.35,
            }}
          >
            {cfg.titulo}
          </div>
          {cfg.subtitulo && (
            <div
              style={{
                fontSize: 12,
                color: "var(--muted)",
                fontWeight: 600,
                marginTop: 2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {cfg.subtitulo}
            </div>
          )}
          <div
            style={{
              fontSize: 11,
              color: "var(--muted)",
              fontWeight: 600,
              marginTop: 3,
            }}
          >
            {formatarData(notif.em)}
          </div>
        </div>
      </div>
      <button
        onClick={onDispensar}
        style={{
          marginTop: 10,
          width: "100%",
          padding: "8px 12px",
          borderRadius: 12,
          border: "1.5px solid var(--linha)",
          background: "var(--card)",
          color: "var(--ink)",
          fontSize: 13,
          fontWeight: 800,
          fontFamily: "inherit",
          cursor: "pointer",
        }}
      >
        {t('Entendi')}
      </button>
    </div>
  );
}
