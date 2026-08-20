// ModalCartao.jsx — criar / editar cartão (nome, cor, fechamento, limite).
//
// Nenhum campo de número nem de bandeira, por decisão explícita: o que
// identifica o cartão aqui é o nome e a cor (ver lib/cartoes.js).

import React from "react";
import { Icon } from "../../ui/icons.jsx";
import { ModalShell, Campo, inputStyle } from "../../ui/modal-shell.jsx";
import {
  CORES_CARTAO,
  COR_CARTAO_PADRAO,
  corTextoSobre,
} from "../../lib/cartoes.js";
import { formatarValorDigitado, formatarValorInicial, parseValorBR } from "../../lib/money-input.js";
import { simboloMoeda } from "../../lib/moeda.js";
import { useT } from "../../lib/i18n.jsx";

export function ModalCartao({ editando, ehPrimeiro, diaFechamentoGlobal, onFechar, onSalvar, onApagar }) {
  const t = useT();
  const [nome, setNome] = React.useState(editando?.nome ?? "");
  const [cor, setCor] = React.useState(editando?.cor ?? COR_CARTAO_PADRAO);
  // Cartão novo herda o fechamento global. Sem isso, quem já tinha configurado
  // "fecha dia 20" veria todas as faturas passadas se reagruparem sozinhas ao
  // cadastrar o primeiro cartão.
  const [fech, setFech] = React.useState(() => {
    const dia = editando ? editando.diaFechamento || 0 : diaFechamentoGlobal || 0;
    return dia > 0 ? String(dia) : "";
  });

  const [limite, setLimite] = React.useState(formatarValorInicial(editando?.limite || 0));

  const diaNum = Math.trunc(Number(fech.replace(/[^0-9]/g, "")) || 0);
  const diaValido = diaNum >= 1 && diaNum <= 31 ? diaNum : 0;
  const limiteNum = parseValorBR(limite);
  const valido = nome.trim().length > 0;

  const salvar = () => {
    if (!valido) return;
    onSalvar({
      ...(editando ? { id: editando.id } : {}),
      nome: nome.trim(),
      cor,
      diaFechamento: diaValido,
      limite: limiteNum > 0 ? limiteNum : 0,
    });
  };

  return (
    <ModalShell
      titulo={editando ? t("Editar cartão") : t("Novo cartão")}
      onFechar={onFechar}
      onSalvar={salvar}
      salvarAtivo={valido}
      corAcento={cor}
      corAcentoTexto={corTextoSobre(cor)}
    >
      <Campo label={t("Nome")}>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder={t("Ex: Nubank")}
          style={inputStyle}
        />
      </Campo>

      {/* Cor do cartão. Os nomes são só a referência de quem reconhece a cor
          pela marca — o app não tem vínculo com banco nenhum. */}
      <Campo label={t("Cor")}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {CORES_CARTAO.map((c) => {
            const sel = cor === c.hex;
            return (
              <button
                key={c.hex}
                onClick={() => setCor(c.hex)}
                title={c.nome}
                aria-label={c.nome}
                aria-pressed={sel}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  background: c.hex,
                  border: sel ? "3px solid var(--ink)" : "3px solid transparent",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 1px 3px rgba(20,16,24,0.18)",
                }}
              >
                {sel && (
                  <Icon name="check" size={15} color={corTextoSobre(c.hex)} strokeWidth={3} />
                )}
              </button>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 11,
            color: "var(--muted)",
            fontWeight: 600,
          }}
        >
          {CORES_CARTAO.find((c) => c.hex === cor)?.nome || t("Personalizada")}
        </div>
      </Campo>

      <Campo label={t("Dia em que a fatura fecha")}>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={fech}
          placeholder={t("Último dia do mês")}
          onChange={(e) => setFech(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))}
          style={inputStyle}
        />
        <div
          style={{
            marginTop: 8,
            fontSize: 11,
            color: "var(--muted)",
            fontWeight: 500,
            lineHeight: 1.45,
          }}
        >
          {diaValido > 0
            ? t("Compras a partir do dia {dia} já entram na fatura seguinte. Não muda o saldo do mês.", { dia: diaValido })
            : t("Em branco, a fatura fecha no último dia do mês. Não muda o saldo do mês.")}
        </div>
      </Campo>

      <Campo label={t("Limite do cartão (opcional)")}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, color: "var(--muted)", fontWeight: 700 }}>{simboloMoeda()}</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={limite}
            onChange={(e) => setLimite(formatarValorDigitado(e.target.value))}
            style={inputStyle}
          />
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 11,
            color: "var(--muted)",
            fontWeight: 500,
            lineHeight: 1.45,
          }}
        >
          {t("É o teto que o banco liberou. Serve pra mostrar quanto do cartão já está comprometido — não é o mesmo que o limite de gasto mensal em Orçamentos.")}
        </div>
      </Campo>

      {/* O aviso do backfill. Só no primeiro cartão — do segundo em diante nada
          é tocado, e mover um gasto de cartão passa a ser manual. */}
      {ehPrimeiro && !editando && (
        <div
          style={{
            marginTop: 16,
            padding: "12px 14px",
            borderRadius: 12,
            background: "var(--card-2)",
            fontSize: 12,
            color: "var(--muted)",
            fontWeight: 600,
            lineHeight: 1.5,
          }}
        >
          {t("Tudo que você já lançou no crédito passa a ser deste cartão. Se cadastrar outro depois, os gastos ficam aqui até você mudar um por um.")}
        </div>
      )}

      {editando && (
        <button
          onClick={onApagar}
          style={{
            width: "100%",
            marginTop: 20,
            padding: "12px",
            borderRadius: 12,
            border: "none",
            cursor: "pointer",
            background: "transparent",
            color: "var(--muted)",
            fontSize: 13,
            fontWeight: 800,
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Icon name="trash" size={15} strokeWidth={2.2} />
          {t("Apagar cartão")}
        </button>
      )}
    </ModalShell>
  );
}
