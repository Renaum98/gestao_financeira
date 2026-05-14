// notificacoes.jsx — Tela de Notificações: lembretes de contas a vencer e
// parcelamentos próximos do fim para o usuário renovar/cancelar.

import React from 'react';
import { CATEGORIAS, MESES_CURTO, fmtBRL } from '../data.js';
import { CatChip, Icon } from '../ui/icons.jsx';
import { Card, TopBar } from '../ui/common.jsx';
import {
  notificacoesSuportadas,
  permissaoNotificacoes,
  pedirPermissaoNotificacoes,
  dispararPendentes,
} from '../lib/notifications.js';

// Calcula as notificações a partir das transações + recorrentes.
// Retorna também `naoLidas` (contagem das não lidas) para alimentar o badge.
export function calcularNotificacoes(txs, recorrentes = [], lidas = []) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const lim7 = new Date(hoje);
  lim7.setDate(lim7.getDate() + 7);
  const lim60 = new Date(hoje);
  lim60.setDate(lim60.getDate() + 60);

  const dataDe = (yyyymmdd) => {
    const [y, m, d] = yyyymmdd.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const proximas = txs
    .filter((t) => {
      if (t.tipo === 'entrada') return false;
      if (!t.recorrenteId && !t.parcelas) return false;
      const dt = dataDe(t.data);
      return dt >= hoje && dt <= lim7;
    })
    .sort((a, b) => a.data.localeCompare(b.data));

  const terminando = txs
    .filter((t) => {
      if (!t.parcelas) return false;
      if (t.parcelas.atual !== t.parcelas.total) return false;
      const dt = dataDe(t.data);
      return dt >= hoje && dt <= lim60;
    })
    .sort((a, b) => a.data.localeCompare(b.data));

  // Recorrências sem pré-geração para o próximo mês — sinaliza que o usuário
  // pode revisar (continuar ou cancelar).
  const proximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);
  const proximoYYMM = `${proximoMes.getFullYear()}-${String(proximoMes.getMonth() + 1).padStart(2, '0')}`;
  const recsRevisar = recorrentes.filter(
    (r) => r.ultimoMesGerado && r.ultimoMesGerado < proximoYYMM,
  );

  const setLidas = new Set(lidas);
  const idsAtivos = [
    ...proximas.map((t) => t.id),
    ...terminando.map((t) => t.id),
    ...recsRevisar.map((r) => r.id),
  ];
  const naoLidas = idsAtivos.filter((id) => !setLidas.has(id)).length;

  return { proximas, terminando, recsRevisar, naoLidas, idsAtivos };
}

export function NotificacoesScreen({ ctx }) {
  const { txs, recorrentes, voltar, ocultar, irPara, preferences, setPreferences } = ctx;
  const lidas = preferences?.notifLidas || [];
  const { proximas, terminando, recsRevisar, idsAtivos } = React.useMemo(
    () => calcularNotificacoes(txs, recorrentes, lidas),
    [txs, recorrentes, lidas],
  );

  const total = proximas.length + terminando.length + recsRevisar.length;
  const setLidas = React.useMemo(() => new Set(lidas), [lidas]);
  const ehLida = (id) => setLidas.has(id);

  const marcarLida = (id) => {
    if (setLidas.has(id)) return;
    // Mantém apenas IDs ainda ativos para o array não crescer indefinidamente.
    const ativosSet = new Set(idsAtivos);
    const limpa = lidas.filter((x) => ativosSet.has(x));
    setPreferences({ notifLidas: [...limpa, id] });
  };

  // Permissão e disparo de notificações nativas (Web Notifications API).
  const [permissao, setPermissao] = React.useState(() => permissaoNotificacoes());

  // Sempre que entra na tela, dispara o que estiver pendente (se já tem permissão).
  React.useEffect(() => {
    if (permissao === 'granted') {
      dispararPendentes({ proximas, terminando, lidas, idsAtivos });
    }
  }, [permissao, proximas, terminando, lidas, idsAtivos]);

  const ativarNotificacoes = async () => {
    const r = await pedirPermissaoNotificacoes();
    setPermissao(r);
    if (r === 'granted') {
      dispararPendentes({ proximas, terminando, lidas, idsAtivos });
    }
  };

  const diasAte = (yyyymmdd) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const [y, m, d] = yyyymmdd.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return Math.ceil((dt - hoje) / (1000 * 60 * 60 * 24));
  };
  const rotuloPrazo = (n) =>
    n <= 0 ? 'Hoje' : n === 1 ? 'Amanhã' : `Em ${n} dias`;

  return (
    <div style={{ paddingBottom: 'var(--pad-bottom)' }}>
      <TopBar voltar={voltar} titulo="Notificações" />

      {/* Banner para ativar notificações do sistema */}
      {notificacoesSuportadas() && permissao !== 'granted' && permissao !== 'unsupported' && (
        <div style={{ padding: '4px 20px 0' }}>
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 16,
              background: permissao === 'denied' ? 'var(--surface-sunken)' : 'color-mix(in oklab, var(--primary) 8%, var(--card))',
              border: '1px solid color-mix(in oklab, var(--primary) 18%, transparent)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: 'linear-gradient(135deg, var(--primary), var(--primary-2))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name="bell" size={18} color="#fff" strokeWidth={2.4} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>
                {permissao === 'denied'
                  ? 'Notificações bloqueadas'
                  : 'Receba lembretes no celular'}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--muted)',
                  fontWeight: 500,
                  marginTop: 2,
                  lineHeight: 1.4,
                }}
              >
                {permissao === 'denied'
                  ? 'Habilite nas configurações do navegador/sistema para receber lembretes.'
                  : 'Avisamos quando uma conta estiver perto de vencer, mesmo com o app fechado.'}
              </div>
            </div>
            {permissao !== 'denied' && (
              <button
                onClick={ativarNotificacoes}
                style={{
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-2))',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px color-mix(in oklab, var(--primary) 28%, transparent)',
                }}
              >
                Ativar
              </button>
            )}
          </div>
        </div>
      )}

      {total === 0 && (
        <div style={{ padding: '4px 20px 0' }}>
          <Card style={{ padding: 28, textAlign: 'center' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                background: 'color-mix(in oklab, var(--primary) 14%, transparent)',
                margin: '0 auto 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="bell" size={26} color="var(--primary)" strokeWidth={2.2} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)' }}>
              Tudo em dia
            </div>
            <div
              style={{
                fontSize: 13,
                color: 'var(--muted)',
                fontWeight: 500,
                marginTop: 6,
                lineHeight: 1.4,
              }}
            >
              Sem contas a vencer nos próximos dias.
            </div>
          </Card>
        </div>
      )}

      {proximas.length > 0 && (
        <Secao titulo="Próximas a vencer" subtitulo="Cobranças nos próximos 7 dias">
          <Card style={{ padding: '4px 16px' }}>
            {proximas.map((tx, i) => {
              const [, mm, dd] = tx.data.split('-').map(Number);
              const n = diasAte(tx.data);
              const urgente = n <= 3 && !ehLida(tx.id);
              const lida = ehLida(tx.id);
              return (
                <div
                  key={tx.id}
                  onClick={() => marcarLida(tx.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 0',
                    borderTop: i === 0 ? 'none' : '1px solid var(--linha)',
                    cursor: lida ? 'default' : 'pointer',
                    opacity: lida ? 0.5 : 1,
                    transition: 'opacity .2s',
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      background: urgente
                        ? 'color-mix(in oklab, #D63A55 12%, transparent)'
                        : 'var(--surface-sunken)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: urgente ? '#D63A55' : 'var(--ink)',
                        lineHeight: 1,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {dd}
                    </div>
                    <div
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: urgente ? '#D63A55' : 'var(--muted)',
                        marginTop: 2,
                        textTransform: 'uppercase',
                      }}
                    >
                      {MESES_CURTO[mm - 1]}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: 'var(--ink)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {tx.descricao}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: urgente ? '#D63A55' : 'var(--muted)',
                        fontWeight: 600,
                        marginTop: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      {rotuloPrazo(n)}
                      <span style={{ opacity: 0.5 }}>·</span>
                      {tx.parcelas
                        ? `Parcela ${tx.parcelas.atual}/${tx.parcelas.total}`
                        : 'Mensal'}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: 'var(--ink)',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {fmtBRL(tx.valor, ocultar)}
                  </div>
                </div>
              );
            })}
          </Card>
        </Secao>
      )}

      {terminando.length > 0 && (
        <Secao
          titulo="Parcelamentos terminando"
          subtitulo="Em breve liberam espaço no seu orçamento"
        >
          <Card style={{ padding: '4px 16px' }}>
            {terminando.map((tx, i) => {
              const n = diasAte(tx.data);
              const lida = ehLida(tx.id);
              return (
                <div
                  key={tx.id}
                  onClick={() => marcarLida(tx.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 0',
                    borderTop: i === 0 ? 'none' : '1px solid var(--linha)',
                    cursor: lida ? 'default' : 'pointer',
                    opacity: lida ? 0.5 : 1,
                    transition: 'opacity .2s',
                  }}
                >
                  <CatChip catId={tx.categoria} size={42} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: 'var(--ink)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {tx.descricao}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--muted)',
                        fontWeight: 600,
                        marginTop: 2,
                      }}
                    >
                      Última parcela {rotuloPrazo(n).toLowerCase()} ·{' '}
                      {tx.parcelas.total}× {fmtBRL(tx.parcelas.valorTotal, ocultar)}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#1B9E6A',
                      background: 'color-mix(in oklab, #1B9E6A 14%, transparent)',
                      padding: '4px 8px',
                      borderRadius: 8,
                      letterSpacing: '-0.01em',
                      flexShrink: 0,
                    }}
                  >
                    {tx.parcelas.atual}/{tx.parcelas.total}
                  </div>
                </div>
              );
            })}
          </Card>
        </Secao>
      )}

      {recsRevisar.length > 0 && (
        <Secao
          titulo="Recorrências para revisar"
          subtitulo="Cobranças não geradas para o próximo mês. Cancele ou continue."
          acao={
            <button
              onClick={() => irPara('recorrentes')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--primary)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                padding: 0,
                fontFamily: 'inherit',
              }}
            >
              Gerenciar →
            </button>
          }
        >
          <Card style={{ padding: '4px 16px' }}>
            {recsRevisar.map((r, i) => {
              const cat = CATEGORIAS[r.categoria] || CATEGORIAS.outros;
              const [ay, am] = (r.ultimoMesGerado || '').split('-');
              const ultimo =
                ay && am ? `${MESES_CURTO[parseInt(am, 10) - 1]}/${ay.slice(2)}` : '—';
              const lida = ehLida(r.id);
              return (
                <div
                  key={r.id}
                  onClick={() => marcarLida(r.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 0',
                    borderTop: i === 0 ? 'none' : '1px solid var(--linha)',
                    cursor: lida ? 'default' : 'pointer',
                    opacity: lida ? 0.5 : 1,
                    transition: 'opacity .2s',
                  }}
                >
                  <CatChip catId={r.categoria} size={42} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: 'var(--ink)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {r.descricao}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--muted)',
                        fontWeight: 600,
                        marginTop: 2,
                      }}
                    >
                      {cat.nome} · última cobrança em {ultimo}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: 'var(--ink)',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {fmtBRL(r.valor, ocultar)}
                  </div>
                </div>
              );
            })}
          </Card>
        </Secao>
      )}
    </div>
  );
}

function Secao({ titulo, subtitulo, acao, children }) {
  return (
    <div style={{ padding: '4px 20px 0', marginTop: 18 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          padding: '0 4px 8px',
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>
            {titulo}
          </div>
          {subtitulo && (
            <div
              style={{
                fontSize: 11,
                color: 'var(--muted)',
                fontWeight: 600,
                marginTop: 2,
              }}
            >
              {subtitulo}
            </div>
          )}
        </div>
        {acao}
      </div>
      {children}
    </div>
  );
}
