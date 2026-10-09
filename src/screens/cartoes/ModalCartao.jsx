// ModalCartao.jsx — criar / editar cartão (nome, cor, fechamento, vencimento,
// limite).
//
// Nenhum campo de número nem de bandeira, por decisão explícita: o que
// identifica o cartão aqui é o nome e a cor (ver lib/cartoes.js).

import React from "react";
import { Icon } from "../../ui/icons.jsx";
import { ModalShell } from "../../ui/modal-shell.jsx";
import {
  Aviso,
  InputMoedaLinha,
  Linha,
  ListaAgrupada,
  NotaLinha,
  SeletorCores,
  estiloInputLinha,
  estiloValorLinha,
} from "../../ui/form-lista.jsx";
import {
  CORES_CARTAO,
  COR_CARTAO_PADRAO,
  corTextoSobre,
} from "../../lib/cartoes.js";
import { formatarValorInicial, parseValorBR } from "../../lib/money-input.js";
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

  const [venc, setVenc] = React.useState(() =>
    editando?.diaVencimento > 0 ? String(editando.diaVencimento) : "",
  );

  const [limite, setLimite] = React.useState(formatarValorInicial(editando?.limite || 0));

  const diaDe = (texto) => {
    const n = Math.trunc(Number(texto.replace(/[^0-9]/g, "")) || 0);
    return n >= 1 && n <= 31 ? n : 0;
  };
  const diaValido = diaDe(fech);
  const vencValido = diaDe(venc);
  const limiteNum = parseValorBR(limite);
  const valido = nome.trim().length > 0;

  const salvar = () => {
    if (!valido) return;
    onSalvar({
      ...(editando ? { id: editando.id } : {}),
      nome: nome.trim(),
      cor,
      diaFechamento: diaValido,
      diaVencimento: vencValido,
      limite: limiteNum > 0 ? limiteNum : 0,
    });
  };

  const estiloDia = {
    ...estiloValorLinha,
    width: 40,
    textAlign: "right",
    fontSize: 16 /* >=16 evita zoom no iOS */,
    fontWeight: 800,
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
      {/* Nome e cor. O ícone antes do nome já sai na cor escolhida. Os nomes
          das cores são só a referência de quem reconhece a cor pela marca — o
          app não tem vínculo com banco nenhum. */}
      <ListaAgrupada>
        <Linha
          as="label"
          inicio={
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: "var(--raio-compacto)",
                background: cor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "background .2s",
              }}
            >
              <Icon name="card" size={14} color={corTextoSobre(cor)} strokeWidth={2.2} />
            </span>
          }
        >
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder={t("Ex: Nubank")}
            aria-label={t("Nome")}
            style={estiloInputLinha}
          />
        </Linha>
        <Linha divisoria style={{ padding: "10px 14px", flexDirection: "column", alignItems: "stretch", gap: 6 }}>
          <SeletorCores
            cores={CORES_CARTAO}
            valor={cor}
            onChange={setCor}
            comCheck
            corCheck={corTextoSobre}
          />
          <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>
            {CORES_CARTAO.find((c) => c.hex === cor)?.nome || t("Personalizada")}
          </div>
        </Linha>
      </ListaAgrupada>

      {/* Fatura: fechamento e vencimento. A explicação de cada dia vem de
          legenda da própria linha. */}
      <ListaAgrupada>
        <Linha
          icone="calendar"
          rotulo={t("Dia em que a fatura fecha")}
          legenda={diaValido > 0
            ? t("Compras a partir do dia {dia} já entram na fatura seguinte. Não muda o saldo do mês.", { dia: diaValido })
            : t("Em branco, a fatura fecha no último dia do mês. Não muda o saldo do mês.")}
          as="label"
        >
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={fech}
            placeholder="—"
            onChange={(e) => setFech(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))}
            style={estiloDia}
          />
        </Linha>
        <Linha
          icone="bell"
          rotulo={t("Dia em que a fatura vence")}
          legenda={vencValido > 0
            ? t("Você recebe um lembrete antes do dia {dia} com o valor da fatura. As contas no cartão não têm lembrete próprio.", { dia: vencValido })
            : t("Com o dia preenchido, você recebe um lembrete da fatura antes de vencer.")}
          divisoria
          as="label"
        >
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={venc}
            placeholder="—"
            onChange={(e) => setVenc(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))}
            style={estiloDia}
          />
        </Linha>
      </ListaAgrupada>

      <ListaAgrupada>
        <Linha icone="target" rotulo={t("Limite do cartão (opcional)")} as="label">
          <InputMoedaLinha valor={limite} onChange={setLimite} ariaLabel={t("Limite do cartão (opcional)")} />
        </Linha>
        <NotaLinha>
          {t("É o teto que o banco liberou. Serve pra mostrar quanto do cartão já está comprometido — não é o mesmo que o limite de gasto mensal em Orçamentos.")}
        </NotaLinha>
      </ListaAgrupada>

      {/* O aviso do backfill. Só no primeiro cartão — do segundo em diante nada
          é tocado, e mover um gasto de cartão passa a ser manual. */}
      {ehPrimeiro && !editando && (
        <Aviso icone="card">
          {t("Tudo que você já lançou no crédito passa a ser deste cartão. Se cadastrar outro depois, os gastos ficam aqui até você mudar um por um.")}
        </Aviso>
      )}

      {editando && (
        <button
          onClick={onApagar}
          style={{
            width: "100%",
            marginTop: 14,
            padding: "10px",
            borderRadius: "var(--raio-pilula)",
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
