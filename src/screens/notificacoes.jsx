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
import { aceitarConvite, recusarConvite } from '../lib/partnership.js';
import { COR_POS, COR_NEG, COR_AVISO } from '../lib/colors.js';

// Calcula as notificações a partir das transações + recorrentes + orçamentos.
// Retorna também `naoLidas` (contagem das não lidas) para alimentar o badge.
//
// `orcamentos` é opcional — só geram alerta as categorias com valor > 0
// definido pelo usuário (orçamento por categoria é uma medida opcional).
export function calcularNotificacoes(
  txs,
  recorrentes = [],
  lidas = [],
  convites = [],
  notifsParceria = [],
  orcamentos = {},
) {
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

  // ─── Alertas de orçamento por categoria (mês atual) ───────────────────
  // Só categorias com orçamento explícito (>0) entram aqui. Calcula o gasto
  // do mês corrente por categoria e classifica em "estourada" (>100%) ou
  // "perto do limite" (≥90% e ≤100%). IDs por mês para não repetir alerta
  // após virada de mês.
  const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  const gastosMesPorCat = {};
  for (const t of txs) {
    if (t.tipo === 'entrada') continue;
    if (!t.data || !t.data.startsWith(mesAtual)) continue;
    gastosMesPorCat[t.categoria] = (gastosMesPorCat[t.categoria] || 0) + t.valor;
  }
  const orcEstourados = [];
  const orcProximos = [];
  for (const [catId, orc] of Object.entries(orcamentos || {})) {
    if (!(orc > 0)) continue;
    const gasto = gastosMesPorCat[catId] || 0;
    const pct = (gasto / orc) * 100;
    if (pct > 100) {
      orcEstourados.push({
        id: `orc-est-${catId}-${mesAtual}`,
        catId, gasto, orc, pct, mes: mesAtual,
      });
    } else if (pct >= 90) {
      orcProximos.push({
        id: `orc-prox-${catId}-${mesAtual}`,
        catId, gasto, orc, pct, mes: mesAtual,
      });
    }
  }
  // Ordena: maiores % primeiro (mais urgente no topo).
  orcEstourados.sort((a, b) => b.pct - a.pct);
  orcProximos.sort((a, b) => b.pct - a.pct);

  const setLidas = new Set(lidas);
  const idsAtivos = [
    ...proximas.map((t) => t.id),
    ...terminando.map((t) => t.id),
    ...recsRevisar.map((r) => r.id),
    ...orcEstourados.map((o) => o.id),
    ...orcProximos.map((o) => o.id),
  ];
  // Convites pendentes e eventos de parceria sempre contam como "não lidos".
  const naoLidas =
    idsAtivos.filter((id) => !setLidas.has(id)).length +
    convites.length +
    notifsParceria.length;

  return {
    proximas,
    terminando,
    recsRevisar,
    convites,
    orcEstourados,
    orcProximos,
    naoLidas,
    idsAtivos,
  };
}

export function NotificacoesScreen({ ctx }) {
  const {
    txs, recorrentes, voltar, ocultar, irPara, preferences, setPreferences,
    convitesRecebidos = [], usuario, orcamentos = {},
    notificacoesParceria = [], dispensarNotifParceria,
  } = ctx;
  const lidas = preferences?.notifLidas || [];
  const { proximas, terminando, recsRevisar, orcEstourados, orcProximos, idsAtivos } = React.useMemo(
    () => calcularNotificacoes(txs, recorrentes, lidas, convitesRecebidos, notificacoesParceria, orcamentos),
    [txs, recorrentes, lidas, convitesRecebidos, notificacoesParceria, orcamentos],
  );

  const total =
    proximas.length +
    terminando.length +
    recsRevisar.length +
    orcEstourados.length +
    orcProximos.length +
    convitesRecebidos.length +
    notificacoesParceria.length;
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
      dispararPendentes({ proximas, terminando, orcEstourados, orcProximos, lidas, idsAtivos });
    }
  }, [permissao, proximas, terminando, orcEstourados, orcProximos, lidas, idsAtivos]);

  const ativarNotificacoes = async () => {
    const r = await pedirPermissaoNotificacoes();
    setPermissao(r);
    if (r === 'granted') {
      dispararPendentes({ proximas, terminando, orcEstourados, orcProximos, lidas, idsAtivos });
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

      {notificacoesParceria.length > 0 && (
        <Secao titulo="Conta compartilhada" subtitulo="Eventos recentes da parceria">
          <Card style={{ padding: '4px 16px' }}>
            {notificacoesParceria.map((n, i) => (
              <NotifParceriaItem
                key={n.id}
                notif={n}
                primeiro={i === 0}
                onDispensar={() => dispensarNotifParceria?.(n.id)}
              />
            ))}
          </Card>
        </Secao>
      )}

      {convitesRecebidos.length > 0 && (
        <Secao
          titulo="Convites de conta compartilhada"
          subtitulo="Aceite para visualizar os gastos um do outro"
        >
          <Card style={{ padding: '4px 16px' }}>
            {convitesRecebidos.map((c, i) => (
              <ConviteItem
                key={c.id}
                convite={c}
                meuUid={usuario?.uid}
                meuNome={preferences?.nome || usuario?.displayName || ''}
                meuEmail={usuario?.email || ''}
                primeiro={i === 0}
              />
            ))}
          </Card>
        </Secao>
      )}

      {(orcEstourados.length > 0 || orcProximos.length > 0) && (
        <Secao
          titulo="Orçamento por categoria"
          subtitulo="Alertas das categorias com orçamento definido"
          acao={
            <button
              onClick={() => irPara('orcamentos')}
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
              Ajustar →
            </button>
          }
        >
          <Card style={{ padding: '4px 16px' }}>
            {[...orcEstourados, ...orcProximos].map((a, i) => {
              const cat = CATEGORIAS[a.catId] || CATEGORIAS.outros;
              const estourou = a.pct > 100;
              const cor = estourou ? COR_NEG : COR_AVISO;
              return (
                <NotifItem
                  key={a.id}
                  primeiro={i === 0}
                  lida={ehLida(a.id)}
                  onClick={() => marcarLida(a.id)}
                  leading={<CatChip catId={a.catId} size={42} />}
                  titulo={
                    estourou
                      ? `${cat.nome} estourou o orçamento`
                      : `${cat.nome} chegando ao limite`
                  }
                  subtituloCor={cor}
                  subtitulo={
                    <>
                      {fmtBRL(a.gasto, ocultar)} de {fmtBRL(a.orc, ocultar)}
                      <span style={{ opacity: 0.5, padding: '0 4px' }}>·</span>
                      {Math.round(a.pct)}%
                    </>
                  }
                  trailing={
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: cor,
                        background: `color-mix(in oklab, ${cor} 14%, transparent)`,
                        padding: '4px 8px',
                        borderRadius: 8,
                        flexShrink: 0,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {Math.round(a.pct)}%
                    </div>
                  }
                />
              );
            })}
          </Card>
        </Secao>
      )}

      {proximas.length > 0 && (
        <Secao titulo="Próximas a vencer" subtitulo="Cobranças nos próximos 7 dias">
          <Card style={{ padding: '4px 16px' }}>
            {proximas.map((tx, i) => {
              const [, mm, dd] = tx.data.split('-').map(Number);
              const n = diasAte(tx.data);
              const urgente = n <= 3 && !ehLida(tx.id);
              return (
                <NotifItem
                  key={tx.id}
                  primeiro={i === 0}
                  lida={ehLida(tx.id)}
                  onClick={() => marcarLida(tx.id)}
                  leading={
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        background: urgente
                          ? `color-mix(in oklab, ${COR_NEG} 12%, transparent)`
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
                          color: urgente ? COR_NEG : 'var(--ink)',
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
                          color: urgente ? COR_NEG : 'var(--muted)',
                          marginTop: 2,
                          textTransform: 'uppercase',
                        }}
                      >
                        {MESES_CURTO[mm - 1]}
                      </div>
                    </div>
                  }
                  titulo={tx.descricao}
                  subtituloCor={urgente ? COR_NEG : undefined}
                  subtitulo={
                    <>
                      {rotuloPrazo(n)}
                      <span style={{ opacity: 0.5 }}>·</span>
                      {tx.parcelas
                        ? `Parcela ${tx.parcelas.atual}/${tx.parcelas.total}`
                        : 'Mensal'}
                    </>
                  }
                  trailing={
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
                  }
                />
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
              return (
                <NotifItem
                  key={tx.id}
                  primeiro={i === 0}
                  lida={ehLida(tx.id)}
                  onClick={() => marcarLida(tx.id)}
                  leading={<CatChip catId={tx.categoria} size={42} />}
                  titulo={tx.descricao}
                  subtitulo={
                    <>
                      Última parcela {rotuloPrazo(n).toLowerCase()} ·{' '}
                      {tx.parcelas.total}× {fmtBRL(tx.parcelas.valorTotal, ocultar)}
                    </>
                  }
                  trailing={
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: COR_POS,
                        background: `color-mix(in oklab, ${COR_POS} 14%, transparent)`,
                        padding: '4px 8px',
                        borderRadius: 8,
                        letterSpacing: '-0.01em',
                        flexShrink: 0,
                      }}
                    >
                      {tx.parcelas.atual}/{tx.parcelas.total}
                    </div>
                  }
                />
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
              return (
                <NotifItem
                  key={r.id}
                  primeiro={i === 0}
                  lida={ehLida(r.id)}
                  onClick={() => marcarLida(r.id)}
                  leading={<CatChip catId={r.categoria} size={42} />}
                  titulo={r.descricao}
                  subtitulo={`${cat.nome} · última cobrança em ${ultimo}`}
                  trailing={
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
                  }
                />
              );
            })}
          </Card>
        </Secao>
      )}
    </div>
  );
}

// Configuração visual por tipo de notificação de parceria.
function configNotif(notif) {
  switch (notif.tipo) {
    case 'parceria-aceita':
      return {
        cor: COR_POS,
        icone: 'check',
        titulo: (
          <>
            <strong>{notif.por}</strong> aceitou seu convite!
          </>
        ),
        subtitulo: 'Conta compartilhada ativada.',
      };
    case 'caixinha-criada':
      return {
        cor: 'var(--primary)',
        icone: 'piggy',
        titulo: (
          <>
            <strong>{notif.por}</strong> criou uma caixinha
          </>
        ),
        subtitulo: notif.caixinhaNome ? `"${notif.caixinhaNome}"` : null,
      };
    case 'caixinha-deposito':
      return {
        cor: COR_POS,
        icone: 'plus',
        titulo: (
          <>
            <strong>{notif.por}</strong> depositou {fmtBRL(notif.valor || 0)}
          </>
        ),
        subtitulo: notif.caixinhaNome
          ? `Na caixinha "${notif.caixinhaNome}"`
          : null,
      };
    case 'parceria-desfeita':
    default:
      return {
        cor: COR_NEG,
        icone: 'close',
        titulo: (
          <>
            <strong>{notif.por}</strong> desfez a conta compartilhada
          </>
        ),
        subtitulo: null,
      };
  }
}

function NotifParceriaItem({ notif, primeiro, onDispensar }) {
  const cfg = configNotif(notif);
  const formatarData = (iso) => {
    try {
      const d = new Date(iso);
      const dn = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.getDay()];
      return `${dn}, ${d.getDate()} ${MESES_CURTO[d.getMonth()]} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch {
      return '';
    }
  };

  return (
    <div
      style={{
        padding: '14px 0',
        borderTop: primeiro ? 'none' : '1px solid var(--linha)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: `color-mix(in oklab, ${cfg.cor} 14%, transparent)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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
              color: 'var(--ink)',
              lineHeight: 1.35,
            }}
          >
            {cfg.titulo}
          </div>
          {cfg.subtitulo && (
            <div
              style={{
                fontSize: 12,
                color: 'var(--muted)',
                fontWeight: 600,
                marginTop: 2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {cfg.subtitulo}
            </div>
          )}
          <div
            style={{
              fontSize: 11,
              color: 'var(--muted)',
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
          width: '100%',
          padding: '8px 12px',
          borderRadius: 12,
          border: '1.5px solid var(--linha)',
          background: 'var(--card)',
          color: 'var(--ink)',
          fontSize: 13,
          fontWeight: 800,
          fontFamily: 'inherit',
          cursor: 'pointer',
        }}
      >
        Entendi
      </button>
    </div>
  );
}

function ConviteItem({ convite, meuUid, meuNome, meuEmail, primeiro }) {
  const [acao, setAcao] = React.useState(null); // 'aceitando' | 'recusando' | null
  const [erro, setErro] = React.useState('');
  const inicial = (convite.fromNome?.trim()[0] || '?').toUpperCase();

  const aceitar = async () => {
    setErro('');
    setAcao('aceitando');
    try {
      await aceitarConvite({
        invite: convite,
        meuUid,
        meuNome,
        meuEmail,
      });
      // O onSnapshot remove o convite da lista automaticamente.
    } catch (err) {
      setErro(err?.message || 'Não foi possível aceitar.');
      setAcao(null);
    }
  };

  const recusar = async () => {
    setErro('');
    setAcao('recusando');
    try {
      await recusarConvite(convite.id);
    } catch (err) {
      setErro('Não foi possível recusar.');
      setAcao(null);
    }
  };

  const ocupado = acao !== null;

  return (
    <div style={{
      padding: '14px 0',
      borderTop: primeiro ? 'none' : '1px solid var(--linha)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 22,
          background: 'linear-gradient(135deg, var(--primary), var(--primary-2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em',
          flexShrink: 0,
        }}>{inicial}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 700, color: 'var(--ink)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {convite.fromNome || 'Alguém'} te convidou
          </div>
          <div style={{
            fontSize: 11.5, color: 'var(--muted)', fontWeight: 600, marginTop: 2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {convite.fromEmail || 'Conta compartilhada'}
          </div>
        </div>
      </div>
      {erro && (
        <div style={{ fontSize: 12, fontWeight: 700, color: COR_NEG, marginTop: 8 }}>
          {erro}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button
          onClick={recusar}
          disabled={ocupado}
          style={{
            flex: 1, padding: '9px 12px', borderRadius: 12,
            border: '1.5px solid var(--linha)', background: 'var(--card)',
            color: COR_NEG, fontSize: 13, fontWeight: 800, fontFamily: 'inherit',
            cursor: ocupado ? 'default' : 'pointer',
            opacity: acao === 'recusando' ? 0.6 : 1,
          }}
        >{acao === 'recusando' ? 'Recusando…' : 'Recusar'}</button>
        <button
          onClick={aceitar}
          disabled={ocupado}
          style={{
            flex: 1, padding: '9px 12px', borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-2))',
            color: '#fff', fontSize: 13, fontWeight: 800, fontFamily: 'inherit',
            cursor: ocupado ? 'default' : 'pointer',
            boxShadow: '0 4px 12px color-mix(in oklab, var(--primary) 28%, transparent)',
            opacity: acao === 'aceitando' ? 0.7 : 1,
          }}
        >{acao === 'aceitando' ? 'Aceitando…' : 'Aceitar'}</button>
      </div>
    </div>
  );
}

// Item de notificação genérico: 3 colunas (leading | titulo+subtitulo | trailing).
// Padroniza padding, divisor entre linhas e estado de "lida" (opacidade reduzida).
// Usado pelas 4 listas estáticas (orçamento, próximas, terminando, recsRevisar);
// convites e eventos de parceria têm UI dedicada com botões.
function NotifItem({
  leading,
  titulo,
  subtitulo,
  subtituloCor,
  trailing,
  primeiro = false,
  lida = false,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 0',
        borderTop: primeiro ? 'none' : '1px solid var(--linha)',
        cursor: lida ? 'default' : (onClick ? 'pointer' : 'default'),
        opacity: lida ? 0.5 : 1,
        transition: 'opacity .2s',
      }}
    >
      {leading}
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
          {titulo}
        </div>
        {subtitulo && (
          <div
            style={{
              fontSize: 11,
              color: subtituloCor || 'var(--muted)',
              fontWeight: 600,
              marginTop: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {subtitulo}
          </div>
        )}
      </div>
      {trailing}
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
