// NotificacoesScreen.jsx — tela de Notificações. Orquestra banner de permissão,
// estado vazio e as seções; cada bloco vive em ./*.

import React from 'react';
import { TopBar } from '../../ui/common.jsx';
import { useT } from '../../lib/i18n.jsx';
import {
  notificacoesSuportadas,
  permissaoNotificacoes,
  pedirPermissaoNotificacoes,
  dispararPendentes,
} from '../../lib/notifications.js';
import { calcularNotificacoes } from './calcular.js';
import { BannerPermissao } from './BannerPermissao.jsx';
import { EstadoVazio } from './EstadoVazio.jsx';
import { NotifParceriaItem } from './NotifParceriaItem.jsx';
import { ConviteItem } from './ConviteItem.jsx';
import { Secao } from './parts.jsx';
import { Card } from '../../ui/common.jsx';
import { SecaoOrcamento } from './SecaoOrcamento.jsx';
import { SecaoProximas } from './SecaoProximas.jsx';
import { SecaoTerminando } from './SecaoTerminando.jsx';
import { SecaoRecorrencias } from './SecaoRecorrencias.jsx';

export function NotificacoesScreen({ ctx }) {
  const {
    txs, recorrentes, voltar, ocultar, irPara, preferences, setPreferences,
    convitesRecebidos = [], usuario, orcamentos = {},
    notificacoesParceria = [], dispensarNotifParceria,
  } = ctx;
  const t = useT();
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

  return (
    <div style={{ paddingBottom: 'var(--pad-bottom)' }}>
      <TopBar voltar={voltar} titulo={t("Notificações")} />

      {notificacoesSuportadas() && permissao !== 'granted' && permissao !== 'unsupported' && (
        <BannerPermissao permissao={permissao} onAtivar={ativarNotificacoes} />
      )}

      {total === 0 && <EstadoVazio />}

      {notificacoesParceria.length > 0 && (
        <Secao titulo={t("Conta compartilhada")} subtitulo={t("Eventos recentes da parceria")}>
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
        <Secao titulo={t("Convites de conta compartilhada")} subtitulo={t("Aceite para visualizar os gastos um do outro")}>
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

      <SecaoOrcamento
        orcEstourados={orcEstourados}
        orcProximos={orcProximos}
        ocultar={ocultar}
        irPara={irPara}
        ehLida={ehLida}
        marcarLida={marcarLida}
      />

      <SecaoProximas proximas={proximas} ocultar={ocultar} ehLida={ehLida} marcarLida={marcarLida} />

      <SecaoTerminando terminando={terminando} ocultar={ocultar} ehLida={ehLida} marcarLida={marcarLida} />

      <SecaoRecorrencias
        recsRevisar={recsRevisar}
        ocultar={ocultar}
        irPara={irPara}
        ehLida={ehLida}
        marcarLida={marcarLida}
      />
    </div>
  );
}
