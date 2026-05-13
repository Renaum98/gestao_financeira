// recorrentes.jsx — Tela para visualizar e cancelar gastos recorrentes.

import React from 'react';
import { CATEGORIAS, fmtBRL, MESES_CURTO } from '../data.js';
import { CatChip, Icon } from '../ui/icons.jsx';
import { Card, TopBar } from '../ui/common.jsx';
import { ConfirmModal } from '../ui/confirm-modal.jsx';

function rotuloDataDeRec(yyyymm) {
  const [a, m] = yyyymm.split('-');
  return `${MESES_CURTO[parseInt(m,10) - 1]} ${a.slice(2)}`;
}

export function RecorrentesScreen({ ctx }) {
  const { recorrentes, cancelarRecorrente, voltar, ocultar, ehDesktop } = ctx;
  const [confirmar, setConfirmar] = React.useState(null);

  return (
    <div style={{ paddingBottom: "var(--pad-bottom)" }}>
      <TopBar voltar={ehDesktop ? undefined : voltar} titulo="Recorrentes" />

      <div style={{ padding: '0 20px 12px', fontSize: 13, color: 'var(--muted)', fontWeight: 500, lineHeight: 1.45 }}>
        Esses gastos são adicionados automaticamente todo mês. Cancele se a cobrança parar.
      </div>

      <div style={{ padding: '4px 20px 0' }}>
        {recorrentes.length === 0 ? (
          <Card style={{ padding: 28, textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 28,
              background: 'color-mix(in oklab, var(--primary) 14%, transparent)',
              margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="history" size={26} color="var(--primary)" strokeWidth={2.2} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)' }}>
              Nenhum gasto recorrente
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500, marginTop: 6, lineHeight: 1.4 }}>
              Ao adicionar um gasto, marque "Repetir todo mês" para ele aparecer aqui e ser lançado automaticamente nos próximos meses.
            </div>
          </Card>
        ) : (
          <Card style={{ padding: '4px 16px' }}>
            {recorrentes.map((r, i) => {
              const cat = CATEGORIAS[r.categoria] || CATEGORIAS.outros;
              return (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0',
                  borderTop: i === 0 ? 'none' : '1px solid var(--linha)',
                }}>
                  <CatChip catId={r.categoria} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.descricao}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginTop: 2 }}>
                      {cat.nome} · todo dia {r.dia} · desde {rotuloDataDeRec(r.inicio)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>
                      {fmtBRL(r.valor, ocultar)}
                    </div>
                    <button onClick={() => setConfirmar(r)} style={{
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      padding: '4px 0 0', color: '#D63A55', fontSize: 11, fontWeight: 700,
                      fontFamily: 'inherit',
                    }}>Cancelar</button>
                  </div>
                </div>
              );
            })}
          </Card>
        )}
      </div>

      {confirmar && (
        <ConfirmModal
          titulo={`Cancelar "${confirmar.descricao}"?`}
          mensagem="Os lançamentos de meses passados continuam no histórico. Os do mês atual em diante serão removidos."
          textoConfirmar="Cancelar recorrência"
          icone="close"
          onCancelar={() => setConfirmar(null)}
          onConfirmar={() => { cancelarRecorrente(confirmar.id); setConfirmar(null); }}
        />
      )}
    </div>
  );
}
