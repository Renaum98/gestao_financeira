// perfil.jsx — Tela Perfil (conta, aparência, atalhos, sair).

import React from 'react';
import { PALETAS, rotuloMes } from '../data.js';
import { Icon } from '../ui/icons.jsx';
import { Card, TopBar } from '../ui/common.jsx';
import { ConfirmModal } from '../ui/confirm-modal.jsx';
import { vibrar } from '../lib/haptics.js';
import { lerFotoPerfil } from '../lib/imagem.js';
import { baixarDadosXLSX } from '../lib/export.js';
import { convidarPorEmail, cancelarConvite } from '../lib/partnership.js';

export function PerfilScreen({ ctx }) {
  const {
    voltar, ocultar, setOcultar, irPara, setOnboarding,
    preferences, setPreferences, usuario, sair, ehDesktop,
    txs, caixinhas, recorrentes, orcamentos, todosMeses,
    partnerUid, partnerNome, convitesEnviados, desfazerParceria,
  } = ctx;
  const nomeConta = usuario?.displayName || '';
  const email = usuario?.email || '';
  const foto = preferences.fotoUrl || usuario?.photoURL || '';
  const nomeExibido = preferences.nome?.trim() || nomeConta || 'Você';
  const inicial = (nomeExibido.trim()[0] || 'F').toUpperCase();

  const [editandoNome, setEditandoNome] = React.useState(false);
  const [nomeTemp, setNomeTemp] = React.useState(preferences.nome || nomeConta);
  const [confirmarSair, setConfirmarSair] = React.useState(false);
  const [erroFoto, setErroFoto] = React.useState('');
  const [carregandoFoto, setCarregandoFoto] = React.useState(false);
  const inputFotoRef = React.useRef(null);
  const [baixar, setBaixar] = React.useState(null); // null | { mes: 'todos' | 'YYYY-MM', baixando, erro }
  const [convidando, setConvidando] = React.useState(false); // modal de convite aberto?
  const [confirmandoDesfazer, setConfirmandoDesfazer] = React.useState(false);
  const [desfazendo, setDesfazendo] = React.useState(false);

  const salvarNome = () => {
    setPreferences({ nome: nomeTemp.trim() });
    setEditandoNome(false);
  };

  const escolherFoto = () => { setErroFoto(''); inputFotoRef.current?.click(); };
  const aoSelecionarFoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite re-selecionar o mesmo arquivo depois
    if (!file) return;
    setErroFoto('');
    setCarregandoFoto(true);
    try {
      const dataUrl = await lerFotoPerfil(file);
      setPreferences({ fotoUrl: dataUrl });
      vibrar(14);
    } catch (err) {
      setErroFoto(err?.message || 'Não foi possível usar essa imagem.');
    }
    setCarregandoFoto(false);
  };
  const removerFoto = () => { setErroFoto(''); setPreferences({ fotoUrl: '' }); vibrar(); };

  const abrirBaixar = () => {
    vibrar();
    setBaixar({ mes: 'todos', baixando: false, erro: '' });
  };
  const executarBaixar = async () => {
    if (!baixar) return;
    setBaixar((b) => ({ ...b, baixando: true, erro: '' }));
    try {
      await baixarDadosXLSX({
        txs, caixinhas, recorrentes, orcamentos,
        mes: baixar.mes === 'todos' ? null : baixar.mes,
        nomeUsuario: preferences.nome || nomeConta,
      });
      vibrar(14);
      setBaixar(null);
    } catch (err) {
      setBaixar((b) => ({ ...b, baixando: false, erro: 'Não foi possível gerar o arquivo.' }));
    }
  };

  return (
    <div style={{ paddingBottom: "var(--pad-bottom)" }}>
      <TopBar voltar={ehDesktop ? undefined : voltar} />
      <div style={{ padding: '0 20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Avatar — clique para trocar a foto */}
        <input
          ref={inputFotoRef}
          type="file"
          accept="image/*"
          onChange={aoSelecionarFoto}
          style={{ display: 'none' }}
        />
        <button
          onClick={escolherFoto}
          aria-label="Alterar foto de perfil"
          style={{
            position: 'relative', width: 88, height: 88, borderRadius: 44, border: 'none',
            padding: 0, cursor: 'pointer', background: 'transparent',
            boxShadow: '0 12px 30px color-mix(in oklab, var(--primary) 22%, transparent)',
            opacity: carregandoFoto ? 0.6 : 1,
          }}
        >
          {foto ? (
            <img
              src={foto}
              alt=""
              referrerPolicy="no-referrer"
              style={{ width: '100%', height: '100%', borderRadius: 44, objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%', borderRadius: 44,
              background: 'linear-gradient(135deg, var(--primary), var(--primary-2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 34, fontWeight: 800, letterSpacing: '-0.04em',
            }}>{inicial}</div>
          )}
          {/* Selo de câmera */}
          <div className="glass-surface" style={{
            position: 'absolute', right: -2, bottom: -2, width: 30, height: 30, borderRadius: 15,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
          }}>
            <Icon name="edit" size={14} color="var(--ink)" strokeWidth={2.2} />
          </div>
        </button>
        {(foto && preferences.fotoUrl) ? (
          <button onClick={removerFoto} style={{
            background: 'transparent', border: 'none', cursor: 'pointer', marginTop: 8,
            color: 'var(--muted)', fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
          }}>Remover foto</button>
        ) : null}
        {erroFoto && (
          <div style={{ fontSize: 12, fontWeight: 700, color: '#D63A55', marginTop: 6, textAlign: 'center' }}>{erroFoto}</div>
        )}

        {editandoNome ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
            <input
              autoFocus
              value={nomeTemp}
              onChange={(e) => setNomeTemp(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') salvarNome(); if (e.key === 'Escape') setEditandoNome(false); }}
              placeholder={nomeConta || 'Seu nome'}
              style={{
                padding: '8px 12px', borderRadius: 12, border: '1.5px solid var(--primary)',
                background: 'var(--card)', fontSize: 16, fontWeight: 700, color: 'var(--ink)',
                fontFamily: 'inherit', outline: 'none', textAlign: 'center', width: 200,
              }}
            />
            <button onClick={salvarNome} style={{
              width: 36, height: 36, borderRadius: 18, border: 'none', cursor: 'pointer',
              background: 'var(--primary)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="check" size={16} strokeWidth={2.6} />
            </button>
          </div>
        ) : (
          <button onClick={() => { setNomeTemp(preferences.nome || nomeConta); setEditandoNome(true); }} style={{
            background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
            display: 'flex', alignItems: 'center', gap: 6, marginTop: 12,
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em' }}>{nomeExibido}</div>
            <Icon name="edit" size={14} color="var(--muted)" strokeWidth={2} />
          </button>
        )}
        {email && (
          <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500, marginTop: 4 }}>{email}</div>
        )}
      </div>

      <div style={{ padding: '24px 20px 0' }}>
        {/* Aparência */}
        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.4, paddingBottom: 12 }}>
            Aparência
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Modo escuro</div>
            <Toggle
              ativo={preferences.modo === 'escuro'}
              onChange={(v) => setPreferences({ modo: v ? 'escuro' : 'claro' })}
            />
          </div>
          <div style={{ padding: '12px 0 4px' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 10 }}>Cor de destaque</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {PALETAS.map(p => {
                const sel = preferences.paleta === p.primary;
                return (
                  <button key={p.primary}
                    onClick={() => { vibrar(); setPreferences({ paleta: p.primary }); }}
                    title={p.nome}
                    className={`swatch-raised${sel ? ' is-selected' : ''}`}
                    style={{
                      width: 30, height: 30, borderRadius: 15,
                      background: `linear-gradient(135deg, ${p.primary}, ${p.primary2})`,
                      color: p.primary,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </Card>

        <div style={{ height: 14 }} />
        <ContaCompartilhadaCard
          partnerUid={partnerUid}
          partnerNome={partnerNome}
          convitePendente={(convitesEnviados || []).find((c) => c.status === 'pendente')}
          onConvidar={() => { vibrar(); setConvidando(true); }}
          onCancelarConvite={async (id) => {
            try { await cancelarConvite(id); vibrar(); } catch {}
          }}
          onDesfazer={() => { vibrar(); setConfirmandoDesfazer(true); }}
        />

        <div style={{ height: 14 }} />
        <Card style={{ padding: '4px 16px' }}>
          <ConfigItem icon="piggy" label="Caixinhas" onClick={() => irPara('caixinhas')} />
          <ConfigItem icon="target" label="Orçamentos" onClick={() => irPara('orcamentos')} />
          <ConfigItem icon="history" label="Recorrentes" onClick={() => irPara('recorrentes')} />
          <ConfigItem icon="calendar" label="Histórico" onClick={() => irPara('historico')} />
          <ConfigItem icon={ocultar ? 'eye-off' : 'eye'} label="Modo privacidade" toggleAtivo={ocultar} onToggle={() => setOcultar(!ocultar)} />
        </Card>

        <div style={{ height: 14 }} />
        <Card style={{ padding: '4px 16px' }}>
          <ConfigItem icon="sparkle" label="Refazer tour" onClick={() => setOnboarding(true)} />
          <ConfigItem icon="list" label="Baixar dados (.xlsx)" onClick={abrirBaixar} />
        </Card>

        <div style={{ height: 18 }} />
        <button onClick={() => setConfirmarSair(true)} style={{
          width: '100%', padding: '14px', borderRadius: 16, border: 'none',
          background: 'var(--card)', color: '#D63A55', fontSize: 14, fontWeight: 800,
          cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D63A55" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <path d="M16 17l5-5-5-5M21 12H9" />
          </svg>
          Sair da conta
        </button>

        <div style={{ padding: '24px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Financeiro · v1.0</div>
        </div>
      </div>

      {confirmarSair && (
        <ConfirmModal
          titulo="Sair da conta?"
          mensagem="Você precisará entrar novamente com seu e-mail e senha. Os dados continuam salvos na nuvem."
          textoConfirmar="Sair"
          icone="close"
          onCancelar={() => setConfirmarSair(false)}
          onConfirmar={() => { setConfirmarSair(false); sair(); }}
        />
      )}

      {confirmandoDesfazer && (
        <ConfirmModal
          titulo="Desfazer conta compartilhada?"
          mensagem={`Vocês deixarão de ver os gastos um do outro. As caixinhas ficarão com você (${partnerNome || 'seu parceiro'} perde acesso).`}
          textoConfirmar={desfazendo ? 'Desfazendo…' : 'Desfazer'}
          icone="close"
          onCancelar={() => { if (!desfazendo) setConfirmandoDesfazer(false); }}
          onConfirmar={async () => {
            if (desfazendo) return;
            setDesfazendo(true);
            try {
              await desfazerParceria();
              setConfirmandoDesfazer(false);
            } catch (err) {
              console.error(err);
            }
            setDesfazendo(false);
          }}
        />
      )}

      {convidando && (
        <ConvidarParceiroModal
          meuUid={usuario?.uid}
          meuNome={preferences.nome || usuario?.displayName || ''}
          meuEmail={usuario?.email || ''}
          onFechar={() => setConvidando(false)}
        />
      )}

      {baixar && (
        <BaixarDadosModal
          mesSelecionado={baixar.mes}
          onSelecionarMes={(m) => setBaixar((b) => ({ ...b, mes: m }))}
          baixando={baixar.baixando}
          erro={baixar.erro}
          todosMeses={todosMeses}
          onCancelar={() => setBaixar(null)}
          onConfirmar={executarBaixar}
        />
      )}
    </div>
  );
}

function BaixarDadosModal({
  mesSelecionado, onSelecionarMes, baixando, erro, todosMeses,
  onCancelar, onConfirmar,
}) {
  return (
    <div
      onClick={baixando ? undefined : onCancelar}
      style={{
        position: 'fixed', inset: 0, height: '100dvh', zIndex: 110,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        background: 'rgba(20, 16, 24, 0.45)',
        backdropFilter: 'blur(12px) saturate(140%)',
        WebkitBackdropFilter: 'blur(12px) saturate(140%)',
        animation: 'fadeIn .28s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          width: '100%', maxWidth: 400,
          background: 'var(--bg)', borderRadius: 24,
          padding: '22px 20px 18px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.28), 0 4px 12px rgba(0,0,0,0.08)',
          animation: 'scaleIn .34s cubic-bezier(0.22, 1, 0.36, 1)',
          maxHeight: 'calc(100dvh - 40px)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14,
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 14,
            background: 'linear-gradient(135deg, var(--primary), var(--primary-2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon name="list" size={20} color="#fff" strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
              Baixar dados
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginTop: 2 }}>
              Arquivo .xlsx para abrir no Excel ou Google Sheets
            </div>
          </div>
        </div>

        <div style={{
          fontSize: 11, fontWeight: 800, color: 'var(--muted)',
          textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, paddingLeft: 2,
        }}>
          Período
        </div>

        <div style={{
          flex: 1, minHeight: 0, overflowY: 'auto',
          border: '1px solid var(--linha)', borderRadius: 14,
          background: 'var(--card)',
        }}>
          <OpcaoBaixar
            label="Todos os dados"
            descricao="Transações, caixinhas, recorrentes e orçamentos"
            selecionado={mesSelecionado === 'todos'}
            onClick={() => onSelecionarMes('todos')}
          />
          {todosMeses.map((m) => (
            <OpcaoBaixar
              key={m}
              label={rotuloMes(m)}
              descricao="Apenas transações deste mês"
              selecionado={mesSelecionado === m}
              onClick={() => onSelecionarMes(m)}
            />
          ))}
        </div>

        {erro && (
          <div style={{
            marginTop: 10, fontSize: 12.5, fontWeight: 700,
            color: '#D63A55', textAlign: 'center',
          }}>{erro}</div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button
            onClick={onCancelar}
            disabled={baixando}
            style={{
              flex: 1, padding: 12, borderRadius: 14, border: 'none',
              background: 'var(--card-2)', color: 'var(--ink)',
              fontSize: 14, fontWeight: 800, fontFamily: 'inherit',
              cursor: baixando ? 'default' : 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
              opacity: baixando ? 0.6 : 1,
            }}
          >Cancelar</button>
          <button
            onClick={onConfirmar}
            disabled={baixando}
            style={{
              flex: 1, padding: 12, borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-2))',
              color: '#fff', fontSize: 14, fontWeight: 800, fontFamily: 'inherit',
              cursor: baixando ? 'default' : 'pointer',
              boxShadow: '0 4px 14px color-mix(in oklab, var(--primary) 32%, transparent)',
              opacity: baixando ? 0.7 : 1,
            }}
          >{baixando ? 'Gerando…' : 'Baixar'}</button>
        </div>
      </div>
    </div>
  );
}

function OpcaoBaixar({ label, descricao, selecionado, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left',
        background: selecionado ? 'color-mix(in oklab, var(--primary) 8%, transparent)' : 'transparent',
        border: 'none', borderBottom: '1px solid var(--linha)',
        padding: '12px 14px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 12,
        fontFamily: 'inherit',
      }}
    >
      <div style={{
        width: 22, height: 22, borderRadius: 11,
        border: `2px solid ${selecionado ? 'var(--primary)' : 'var(--linha)'}`,
        background: selecionado ? 'var(--primary)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, transition: 'all .15s',
      }}>
        {selecionado && <Icon name="check" size={12} color="#fff" strokeWidth={3} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{label}</div>
        {descricao && (
          <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 500, marginTop: 2 }}>
            {descricao}
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Conta compartilhada ───────────────────────────────────────────────────

function ContaCompartilhadaCard({
  partnerUid, partnerNome, convitePendente, onConvidar, onCancelarConvite, onDesfazer,
}) {
  const conectado = !!partnerUid;
  const inicialParceiro = (partnerNome?.trim()[0] || '?').toUpperCase();

  return (
    <Card style={{ padding: 16 }}>
      <div style={{
        fontSize: 12, fontWeight: 700, color: 'var(--muted)',
        textTransform: 'uppercase', letterSpacing: 0.4, paddingBottom: 12,
      }}>
        Conta compartilhada
      </div>

      {conectado ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 22,
              background: 'linear-gradient(135deg, var(--primary), var(--primary-2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em',
              flexShrink: 0,
            }}>{inicialParceiro}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>
                Conectado com {partnerNome || 'seu parceiro'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, marginTop: 2 }}>
                Vocês visualizam os gastos um do outro. Caixinhas são compartilhadas.
              </div>
            </div>
          </div>
          <button
            onClick={onDesfazer}
            style={{
              marginTop: 14,
              padding: '9px 14px', borderRadius: 12, border: '1.5px solid var(--linha)',
              background: 'var(--card)', color: '#D63A55',
              fontSize: 13, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            <Icon name="close" size={14} color="#D63A55" strokeWidth={2.4} />
            Desfazer parceria
          </button>
        </div>
      ) : convitePendente ? (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>
            Convite enviado para {convitePendente.toNome || convitePendente.toUid}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, marginBottom: 12 }}>
            Aguardando aceite. Você pode cancelar enquanto não houver resposta.
          </div>
          <button
            onClick={() => onCancelarConvite(convitePendente.id)}
            style={{
              padding: '8px 14px', borderRadius: 12, border: '1.5px solid var(--linha)',
              background: 'var(--card)', color: '#D63A55',
              fontSize: 13, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer',
            }}
          >Cancelar convite</button>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500, lineHeight: 1.45, marginBottom: 12 }}>
            Convide seu parceiro pra que vocês vejam os gastos um do outro e dividam caixinhas.
          </div>
          <button
            onClick={onConvidar}
            style={{
              padding: '10px 16px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-2))',
              color: '#fff', fontSize: 13, fontWeight: 800, fontFamily: 'inherit',
              cursor: 'pointer',
              boxShadow: '0 4px 12px color-mix(in oklab, var(--primary) 28%, transparent)',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}
          >
            <Icon name="plus" size={14} color="#fff" strokeWidth={2.6} />
            Convidar parceiro
          </button>
        </div>
      )}
    </Card>
  );
}

function ConvidarParceiroModal({ meuUid, meuNome, meuEmail, onFechar }) {
  const [email, setEmail] = React.useState('');
  const [erro, setErro] = React.useState('');
  const [enviando, setEnviando] = React.useState(false);
  const [sucesso, setSucesso] = React.useState(false);

  const enviar = async (e) => {
    e?.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      await convidarPorEmail({
        meuUid, meuNome, meuEmail, emailParceiro: email,
      });
      vibrar(14);
      setSucesso(true);
      setTimeout(onFechar, 1200);
    } catch (err) {
      setErro(err?.message || 'Não foi possível enviar o convite.');
      setEnviando(false);
    }
  };

  return (
    <div
      onClick={enviando ? undefined : onFechar}
      style={{
        position: 'fixed', inset: 0, height: '100dvh', zIndex: 110,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        background: 'rgba(20, 16, 24, 0.45)',
        backdropFilter: 'blur(12px) saturate(140%)',
        WebkitBackdropFilter: 'blur(12px) saturate(140%)',
        animation: 'fadeIn .28s ease-out',
      }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={enviar}
        role="dialog"
        aria-modal="true"
        style={{
          width: '100%', maxWidth: 400,
          background: 'var(--bg)', borderRadius: 24,
          padding: '22px 20px 18px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.28), 0 4px 12px rgba(0,0,0,0.08)',
          animation: 'scaleIn .34s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 14,
            background: 'linear-gradient(135deg, var(--primary), var(--primary-2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon name="user" size={20} color="#fff" strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
              Convidar parceiro
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginTop: 2 }}>
              Ele(a) precisa já ter conta no app.
            </div>
          </div>
        </div>

        {sucesso ? (
          <div style={{
            padding: '20px 16px', textAlign: 'center',
            background: 'color-mix(in oklab, #1B9E6A 10%, transparent)',
            border: '1px solid color-mix(in oklab, #1B9E6A 25%, transparent)',
            borderRadius: 14,
          }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#1B9E6A' }}>
              Convite enviado!
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginTop: 4 }}>
              Aguarde a resposta nas notificações.
            </div>
          </div>
        ) : (
          <>
            <label style={{ display: 'block' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 6, paddingLeft: 2 }}>
                E-mail do parceiro
              </div>
              <input
                autoFocus
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="parceiro@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={enviando}
                style={{
                  width: '100%', padding: '13px 14px', borderRadius: 14,
                  border: '1.5px solid var(--linha)', background: 'var(--card)',
                  outline: 'none', fontSize: 15, fontWeight: 600, color: 'var(--ink)',
                  fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />
            </label>

            {erro && (
              <div style={{
                marginTop: 10, fontSize: 12.5, fontWeight: 700,
                color: '#D63A55',
              }}>{erro}</div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button
                type="button"
                onClick={onFechar}
                disabled={enviando}
                style={{
                  flex: 1, padding: 12, borderRadius: 14, border: 'none',
                  background: 'var(--card-2)', color: 'var(--ink)',
                  fontSize: 14, fontWeight: 800, fontFamily: 'inherit',
                  cursor: enviando ? 'default' : 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                  opacity: enviando ? 0.6 : 1,
                }}
              >Cancelar</button>
              <button
                type="submit"
                disabled={enviando || !email.trim()}
                style={{
                  flex: 1, padding: 12, borderRadius: 14, border: 'none',
                  background: (enviando || !email.trim())
                    ? 'var(--linha)'
                    : 'linear-gradient(135deg, var(--primary), var(--primary-2))',
                  color: (enviando || !email.trim()) ? 'var(--muted)' : '#fff',
                  fontSize: 14, fontWeight: 800, fontFamily: 'inherit',
                  cursor: (enviando || !email.trim()) ? 'default' : 'pointer',
                  boxShadow: (enviando || !email.trim())
                    ? 'none'
                    : '0 4px 14px color-mix(in oklab, var(--primary) 32%, transparent)',
                }}
              >{enviando ? 'Enviando…' : 'Enviar convite'}</button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}

function Toggle({ ativo, onChange }) {
  return (
    <div onClick={() => { vibrar(); onChange(!ativo); }} style={{
      width: 42, height: 26, borderRadius: 14,
      background: ativo ? 'var(--primary)' : 'var(--surface-sunken)',
      position: 'relative', cursor: 'pointer', transition: 'background .15s',
    }}>
      <div style={{
        position: 'absolute', top: 2, left: ativo ? 18 : 2,
        width: 22, height: 22, borderRadius: 11, background: '#fff',
        transition: 'left .15s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }} />
    </div>
  );
}

function ConfigItem({ icon, label, onClick, toggleAtivo, onToggle }) {
  return (
    <div onClick={onClick} className="config-item" style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0',
      borderTop: '1px solid var(--linha)',
      cursor: (onClick || onToggle) ? 'pointer' : 'default',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 12, background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon} size={18} color="var(--ink)" strokeWidth={2} />
      </div>
      <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{label}</div>
      {onToggle ? (
        <Toggle ativo={toggleAtivo} onChange={onToggle} />
      ) : (
        <Icon name="chevron-right" size={16} color="var(--muted)" strokeWidth={2} />
      )}
    </div>
  );
}
