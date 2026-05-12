// perfil.jsx — Tela Perfil (conta Google, aparência, atalhos, sair).

import React from 'react';
import { PALETAS } from '../data.js';
import { Icon } from '../ui/icons.jsx';
import { Card, TopBar } from '../ui/common.jsx';
import { ConfirmModal } from '../ui/confirm-modal.jsx';

export function PerfilScreen({ ctx }) {
  const { voltar, ocultar, setOcultar, irPara, setOnboarding, preferences, setPreferences, usuario, sair } = ctx;
  const nomeGoogle = usuario?.displayName || '';
  const email = usuario?.email || '';
  const foto = usuario?.photoURL || '';
  const nomeExibido = preferences.nome?.trim() || nomeGoogle || 'Você';
  const inicial = (nomeExibido.trim()[0] || 'F').toUpperCase();

  const [editandoNome, setEditandoNome] = React.useState(false);
  const [nomeTemp, setNomeTemp] = React.useState(preferences.nome || nomeGoogle);
  const [confirmarSair, setConfirmarSair] = React.useState(false);

  const salvarNome = () => {
    setPreferences({ nome: nomeTemp.trim() });
    setEditandoNome(false);
  };

  return (
    <div style={{ paddingBottom: 110 }}>
      <TopBar voltar={voltar} />
      <div style={{ padding: '0 20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Avatar do Google, se houver foto */}
        {foto ? (
          <img
            src={foto}
            alt=""
            referrerPolicy="no-referrer"
            style={{
              width: 88, height: 88, borderRadius: 44, objectFit: 'cover',
              boxShadow: '0 12px 30px rgba(110,79,246,0.20)',
            }}
          />
        ) : (
          <div style={{
            width: 88, height: 88, borderRadius: 44,
            background: 'linear-gradient(135deg, var(--primary), var(--primary-2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 34, fontWeight: 800, letterSpacing: '-0.04em',
            boxShadow: '0 12px 30px rgba(110,79,246,0.25)',
          }}>{inicial}</div>
        )}

        {editandoNome ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
            <input
              autoFocus
              value={nomeTemp}
              onChange={(e) => setNomeTemp(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') salvarNome(); if (e.key === 'Escape') setEditandoNome(false); }}
              placeholder={nomeGoogle || 'Seu nome'}
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
          <button onClick={() => { setNomeTemp(preferences.nome || nomeGoogle); setEditandoNome(true); }} style={{
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
                    onClick={() => setPreferences({ paleta: p.primary })}
                    title={p.nome}
                    style={{
                      width: 36, height: 36, borderRadius: 18,
                      background: `linear-gradient(135deg, ${p.primary}, ${p.primary2})`,
                      border: sel ? '3px solid var(--ink)' : '3px solid transparent',
                      cursor: 'pointer', padding: 0,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </Card>

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
          mensagem="Você precisará entrar novamente com sua conta Google. Os dados continuam salvos na nuvem."
          textoConfirmar="Sair"
          icone="close"
          onCancelar={() => setConfirmarSair(false)}
          onConfirmar={() => { setConfirmarSair(false); sair(); }}
        />
      )}
    </div>
  );
}

function Toggle({ ativo, onChange }) {
  return (
    <div onClick={() => onChange(!ativo)} style={{
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
    <div onClick={onClick} style={{
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
