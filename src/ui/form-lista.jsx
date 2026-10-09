// form-lista.jsx — as peças visuais dos modais, no padrão que nasceu no modal
// de adicionar gasto: valor grande no topo, seletores em pílula e o resto dos
// campos numa lista agrupada (uma linha por campo, rótulo à esquerda e valor à
// direita). Quem monta um modal novo deve partir daqui, não de estilo solto.
//
// Duas famílias usam estas peças:
//   • formulários (Cancelar · Título · Salvar no topo) — CabecalhoForm;
//   • diálogos (ícone, título, mensagem e dois botões embaixo) — IconeDialogo,
//     TituloDialogo e BotoesDialogo.

import React from "react";
import { CATEGORIAS, PAGAMENTOS } from "../data.js";
import { CatChip, Icon, iconePagamento } from "./icons.jsx";
import { Expansivel } from "./expansivel.jsx";
import { vibrar } from "../lib/haptics.js";
import { simboloMoeda } from "../lib/moeda.js";
import { formatarValorDigitado } from "../lib/money-input.js";
import { PAG_CARTAO } from "../lib/fatura.js";
import { corDoCartao, corTextoSobre } from "../lib/cartoes.js";
import { useT } from "../lib/i18n.jsx";

// ─── Formulário ────────────────────────────────────────────────────────────

// Cancelar · Título · Salvar. `corSalvarTexto` existe porque um acento claro
// (cartão amarelo, por exemplo) engole o branco.
export function CabecalhoForm({ titulo, onCancelar, onSalvar, salvarAtivo, corSalvar, corSalvarTexto, textoSalvar }) {
  const t = useT();
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
      <button
        onClick={onCancelar}
        style={{
          background: "transparent",
          border: "none",
          color: "var(--muted)",
          fontWeight: 700,
          fontSize: 14,
          cursor: "pointer",
          padding: 0,
          fontFamily: "inherit",
          flexShrink: 0,
        }}
      >
        {t("Cancelar")}
      </button>
      <div
        style={{
          fontSize: 16,
          fontWeight: 800,
          color: "var(--ink)",
          letterSpacing: "-0.01em",
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {titulo}
      </div>
      <button
        className="opcao-suave"
        onClick={onSalvar}
        disabled={!salvarAtivo}
        style={{
          background: salvarAtivo ? corSalvar || "var(--primary)" : "var(--linha)",
          color: salvarAtivo ? corSalvarTexto || "#fff" : "var(--muted)",
          border: "none",
          padding: "6px 14px",
          borderRadius: "var(--raio-pilula)",
          fontWeight: 800,
          fontSize: 13,
          cursor: salvarAtivo ? "pointer" : "default",
          fontFamily: "inherit",
          flexShrink: 0,
        }}
      >
        {textoSalvar || t("Salvar")}
      </button>
    </div>
  );
}

// Valor grande, estilo calculadora (cada dígito vira centavo). Tocar em
// qualquer ponto abre o teclado numérico nativo pelo input invisível. Sem
// legenda "Valor": o símbolo da moeda já diz o que é o número. `sinal` mostra
// o "+" da entrada, que abre junto com a cor em vez de piscar.
export function ValorGrande({ valor, onChange, cor, sinal = false, ariaLabel }) {
  const t = useT();
  return (
    <label
      style={{
        display: "block",
        textAlign: "center",
        padding: "10px 0 0",
        cursor: "text",
        position: "relative",
      }}
    >
      <div
        className="tx-valor"
        style={{
          fontSize: 42,
          fontWeight: 800,
          color: cor || "var(--ink)",
          letterSpacing: "-0.04em",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1.1,
        }}
      >
        <span
          className="tx-valor"
          style={{
            fontSize: 20,
            color: cor || "var(--muted)",
            marginRight: 5,
            verticalAlign: "top",
            opacity: cor ? 0.9 : 1,
          }}
        >
          <span
            className="tx-sinal"
            style={{
              display: "inline-block",
              maxWidth: sinal ? "1ch" : 0,
              opacity: sinal ? 1 : 0,
              overflow: "hidden",
              verticalAlign: "top",
            }}
          >
            +
          </span>
          {simboloMoeda()}
        </span>
        {valor}
      </div>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={valor.replace(",", "")}
        onChange={(e) => onChange(formatarValorDigitado(e.target.value))}
        aria-label={ariaLabel || t("Valor")}
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0,
          border: "none",
          background: "transparent",
          outline: "none",
          fontSize: 16 /* >=16 evita zoom no iOS */,
          cursor: "text",
        }}
      />
    </label>
  );
}

// Seletor em pílula compacta, centralizado (Saída/Entrada, origem do valor...).
// Cada opção: { id, label, icon?, bgSel?, textoSel?, disabled? }.
export function SeletorPilula({ opcoes, valor, onChange, style }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: 8, ...style }}>
      <div
        role="radiogroup"
        style={{
          display: "inline-flex",
          gap: 4,
          padding: 3,
          borderRadius: "var(--raio-pilula)",
          background: "var(--card-2)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
        }}
      >
        {opcoes.map((opt) => {
          const sel = valor === opt.id;
          const fundoSel = opt.bgSel || "var(--card)";
          return (
            <button
              key={opt.id}
              role="radio"
              aria-checked={sel}
              className="opcao-suave"
              disabled={opt.disabled}
              onClick={() => { if (opt.disabled) return; vibrar(); onChange(opt.id); }}
              style={{
                padding: "6px 14px",
                borderRadius: "var(--raio-pilula)",
                border: "none",
                background: sel ? fundoSel : "transparent",
                color: opt.disabled
                  ? "var(--linha)"
                  : sel ? opt.textoSel || "var(--ink)" : "var(--muted)",
                fontSize: 12.5,
                fontWeight: 800,
                cursor: opt.disabled ? "default" : "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 5,
                boxShadow: sel && !opt.bgSel ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {/* currentColor: o traço do ícone acompanha a transição de cor
                  do botão em vez de trocar de uma vez. */}
              {opt.icon && <Icon name={opt.icon} size={13} color="currentColor" strokeWidth={2.6} />}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// O cartão que agrupa as linhas.
export function ListaAgrupada({ children, style }) {
  return (
    <div
      style={{
        marginTop: 12,
        borderRadius: "var(--raio-bloco)",
        background: "var(--card-2)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Valor à direita de uma Linha (data, select, texto, número).
export const estiloValorLinha = {
  border: "none",
  background: "transparent",
  outline: "none",
  fontSize: 14,
  fontWeight: 700,
  color: "var(--ink)",
  fontFamily: "inherit",
  padding: 0,
};

// Input de texto que ocupa o resto da linha (nome, descrição, e-mail).
export const estiloInputLinha = {
  ...estiloValorLinha,
  flex: 1,
  minWidth: 0,
  fontSize: 16 /* >=16 evita zoom no iOS */,
  fontWeight: 600,
};

// Valor em dinheiro à direita de uma Linha (meta, limite, saldo inicial), no
// mesmo estilo calculadora do ValorGrande.
export function InputMoedaLinha({ valor, onChange, ariaLabel }) {
  return (
    <span style={{ display: "flex", alignItems: "baseline", gap: 4, flexShrink: 0 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>{simboloMoeda()}</span>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={valor}
        onChange={(e) => onChange(formatarValorDigitado(e.target.value))}
        aria-label={ariaLabel}
        style={{
          ...estiloValorLinha,
          width: 104,
          textAlign: "right",
          fontSize: 16 /* >=16 evita zoom no iOS */,
          fontWeight: 800,
          fontVariantNumeric: "tabular-nums",
        }}
      />
    </span>
  );
}

// Uma linha da lista agrupada: ícone (ou `inicio`, um elemento no lugar dele),
// rótulo com legenda opcional embaixo, e o controle à direita. `divisoria`
// traça o fio de cima — a primeira linha não tem. Com `onClick` vira botão;
// `as="label"` faz o toque em qualquer ponto da linha chegar ao controle dela
// (data, select, toggle, texto).
export function Linha({ icone, inicio, rotulo, legenda, divisoria, onClick, aberto, as, desabilitado, children, style }) {
  const Tag = onClick ? "button" : as || "div";
  return (
    <Tag
      onClick={onClick}
      disabled={onClick ? desabilitado : undefined}
      aria-expanded={onClick && aberto !== undefined ? !!aberto : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        minHeight: 46,
        padding: "8px 14px",
        boxSizing: "border-box",
        border: "none",
        borderTop: divisoria ? "1px solid var(--linha)" : "none",
        background: "transparent",
        textAlign: "left",
        fontFamily: "inherit",
        cursor: desabilitado ? "default" : onClick || as === "label" ? "pointer" : "default",
        opacity: desabilitado ? 0.5 : 1,
        ...style,
      }}
    >
      {inicio || (icone && <Icon name={icone} size={18} color="var(--muted)" strokeWidth={2} />)}
      {rotulo && (
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{rotulo}</div>
          {legenda && (
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", marginTop: 1, lineHeight: 1.35 }}>
              {legenda}
            </div>
          )}
        </div>
      )}
      {children}
    </Tag>
  );
}

// Linha de escolha única (destino, mês, entrada de origem): o check à direita
// marca a escolhida, como nas listas de ajustes do sistema.
export function LinhaOpcao({ selecionado, ...props }) {
  return (
    <Linha {...props}>
      <span style={{ width: 18, display: "flex", justifyContent: "center", flexShrink: 0 }}>
        {selecionado && <Icon name="check" size={17} color="var(--primary)" strokeWidth={2.8} />}
      </span>
    </Linha>
  );
}

// Seta de abre-fecha das linhas que expandem.
export function Chevron({ aberto }) {
  return (
    <span
      style={{
        display: "flex",
        transition: "transform .2s ease",
        transform: aberto ? "rotate(180deg)" : "none",
      }}
    >
      <Icon name="chevron-down" size={16} color="var(--muted)" strokeWidth={2.4} />
    </span>
  );
}

// Texto explicativo dentro da lista, alinhado com os rótulos (depois do ícone).
export function NotaLinha({ children, divisoria = true }) {
  return (
    <div
      style={{
        padding: "10px 14px 10px 42px",
        borderTop: divisoria ? "1px solid var(--linha)" : "none",
        fontSize: 11.5,
        fontWeight: 600,
        color: "var(--muted)",
        lineHeight: 1.45,
      }}
    >
      {children}
    </div>
  );
}

// Texto explicativo embaixo da lista, como o rodapé de um grupo de ajustes.
export function RodapeLista({ children, style }) {
  return (
    <div
      style={{
        padding: "6px 6px 0",
        fontSize: 11,
        fontWeight: 500,
        color: "var(--muted)",
        lineHeight: 1.45,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Aviso colorido curto (orçamento, limite, erro). Sem `cor`, sai neutro — pra
// informação que não é alerta.
export function Aviso({ icone, cor, children, style }) {
  const tinta = cor || "var(--muted)";
  return (
    <div
      style={{
        marginTop: 10,
        padding: "8px 12px",
        borderRadius: "var(--raio-controle)",
        background: cor ? cor + "1A" : "var(--surface-sunken)",
        border: cor ? `1px solid ${cor}55` : "1px solid transparent",
        display: "flex",
        alignItems: "center",
        gap: 9,
        textAlign: "left",
        ...style,
      }}
    >
      {icone && <Icon name={icone} size={16} color={tinta} strokeWidth={2.4} />}
      <div style={{ fontSize: 11.5, fontWeight: cor ? 700 : 600, color: tinta, lineHeight: 1.4 }}>
        {children}
      </div>
    </div>
  );
}

// Fileira de bolinhas de cor (caixinha, cartão). `cores`: lista de hex ou de
// { hex, nome }.
export function SeletorCores({ cores, valor, onChange, comCheck = false, corCheck }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {cores.map((c) => {
        const hex = typeof c === "string" ? c : c.hex;
        const nome = typeof c === "string" ? undefined : c.nome;
        const sel = valor === hex;
        return (
          <button
            key={hex}
            className="opcao-suave"
            onClick={() => { vibrar(); onChange(hex); }}
            title={nome}
            aria-label={nome || hex}
            aria-pressed={sel}
            style={{
              width: 28,
              height: 28,
              borderRadius: "var(--raio-pilula)",
              background: hex,
              border: sel ? "3px solid var(--ink)" : "3px solid transparent",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 1px 3px rgba(20,16,24,0.18)",
              flexShrink: 0,
            }}
          >
            {comCheck && sel && (
              <Icon name="check" size={13} color={corCheck ? corCheck(hex) : "#fff"} strokeWidth={3} />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Categoria e pagamento (gasto e recorrente) ────────────────────────────

// Pílula de categoria. Com `podeExcluir`, segurar 2s (celular) ou dar
// duplo-clique (desktop) pede a exclusão; um toque normal continua
// selecionando. Categorias de fábrica ignoram esses gestos.
const LONG_PRESS_MS = 2000;
const MOVE_TOLERANCE = 10; // px — se o dedo arrasta mais que isso, cancela.

export function PilulaCategoria({ catId, selecionado, ehDesktop, podeExcluir = false, onSelecionar, onPedirExcluir }) {
  const t = useT();
  const cat = CATEGORIAS[catId];
  const timerRef = React.useRef(null);
  const longPressFiredRef = React.useRef(false);
  const inicioRef = React.useRef({ x: 0, y: 0 });

  const limpar = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const iniciarLongPress = (e) => {
    if (!podeExcluir || ehDesktop) return;
    longPressFiredRef.current = false;
    inicioRef.current = { x: e.clientX || 0, y: e.clientY || 0 };
    limpar();
    timerRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      vibrar(28);
      onPedirExcluir();
    }, LONG_PRESS_MS);
  };

  const moverPossivelCancelar = (e) => {
    if (!timerRef.current) return;
    const dx = (e.clientX || 0) - inicioRef.current.x;
    const dy = (e.clientY || 0) - inicioRef.current.y;
    if (dx * dx + dy * dy > MOVE_TOLERANCE * MOVE_TOLERANCE) limpar();
  };

  const aoClicar = (e) => {
    // Se o long-press já disparou, não seleciona a categoria.
    if (longPressFiredRef.current) {
      e.preventDefault();
      e.stopPropagation();
      longPressFiredRef.current = false;
      return;
    }
    onSelecionar();
  };

  const aoDuploClicar = () => {
    if (!podeExcluir || !ehDesktop) return;
    onPedirExcluir();
  };

  // Cleanup ao desmontar.
  React.useEffect(() => () => limpar(), []);

  if (!cat) return null;
  return (
    <button
      onClick={aoClicar}
      onDoubleClick={aoDuploClicar}
      onPointerDown={iniciarLongPress}
      onPointerMove={moverPossivelCancelar}
      onPointerUp={limpar}
      onPointerCancel={limpar}
      onPointerLeave={limpar}
      onContextMenu={(e) => podeExcluir && e.preventDefault()}
      title={podeExcluir ? (ehDesktop ? t("Duplo-clique para excluir") : t("Segure 2s para excluir")) : undefined}
      aria-pressed={selecionado}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 12px 4px 4px",
        borderRadius: "var(--raio-pilula)",
        border: "none",
        // Selecionada: fundo e contorno na cor da categoria, que já é a
        // identidade dela no resto do app.
        background: selecionado
          ? `color-mix(in oklab, ${cat.cor} 14%, var(--card-2))`
          : "var(--card-2)",
        boxShadow: selecionado
          ? "inset 0 0 0 1.5px " + cat.cor
          : "0 1px 2px rgba(0,0,0,0.06)",
        cursor: "pointer",
        flexShrink: 0,
        whiteSpace: "nowrap",
        fontFamily: "inherit",
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
        touchAction: "manipulation",
      }}
    >
      {/* Redondo pra acompanhar a pílula do botão (o chip padrão é quadrado
          de canto suave). */}
      <CatChip catId={catId} size={24} style={{ borderRadius: "var(--raio-pilula)" }} />
      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>
        {t(cat.nome)}
      </span>
    </button>
  );
}

// Fileira de pílulas que rola de lado. O último filho costuma ser o "+ Nova".
export function FileiraPilulas({ children, style }) {
  return (
    <div
      className="carrossel"
      style={{
        display: "flex",
        gap: 6,
        overflowX: "auto",
        padding: "4px 2px",
        margin: "0 -2px",
        scrollbarWidth: "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Rótulo curto da forma de pagamento ("Crédito", "Pix"...), com maiúscula —
// o dicionário guarda "crédito"/"débito" em minúscula pro meio de frase.
export function useRotuloPagamento() {
  const t = useT();
  return (p) => {
    const s = t(p.replace("Cartão de ", ""));
    return s.charAt(0).toUpperCase() + s.slice(1);
  };
}

// Linha "Pagamento" com o resumo ("Crédito · Nubank"); tocar abre as formas de
// pagamento e, no crédito, os cartões. Escolher fecha o painel, a não ser que
// ainda falte escolher o cartão (crédito com mais de um cadastrado).
//
// Os cartões só aparecem com cartão cadastrado — sem nenhum, o app segue como
// antes, com "Cartão de crédito" solto. `permitirSemCartao` mostra a opção
// "Sem cartão", que só existe pra quem já está órfão (sobra de cartão
// apagado), pra não virar um jeito fácil de criar órfão novo.
export function LinhaPagamento({
  pagamento,
  onPagamento,
  cartoes = [],
  cartaoId,
  onCartao,
  permitirSemCartao = false,
  legenda,
  divisoria = true,
}) {
  const t = useT();
  const rotuloPag = useRotuloPagamento();
  const [aberto, setAberto] = React.useState(false);
  const cartaoSel = cartoes.find((c) => c.id === cartaoId);
  const resumo = pagamento === PAG_CARTAO && cartaoSel
    ? `${rotuloPag(pagamento)} · ${cartaoSel.nome}`
    : rotuloPag(pagamento);
  const mostrarCartoes = pagamento === PAG_CARTAO && cartoes.length > 0;

  const escolherPag = (p) => {
    vibrar();
    onPagamento(p);
    if (p !== PAG_CARTAO || cartoes.length <= 1) setAberto(false);
  };
  const escolherCartao = (id) => {
    vibrar();
    onCartao(id);
    setAberto(false);
  };

  const estiloPilulaCartao = (sel, cor, apagada) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "7px 12px",
    borderRadius: "var(--raio-pilula)",
    border: "none",
    background: sel ? cor : "var(--card)",
    color: sel ? corTextoSobre(cor) : apagada ? "var(--muted)" : "var(--ink)",
    fontSize: 11.5,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  });

  return (
    <>
      <Linha
        icone={iconePagamento(pagamento)}
        rotulo={t("Pagamento")}
        legenda={legenda}
        divisoria={divisoria}
        onClick={() => { vibrar(); setAberto((v) => !v); }}
        aberto={aberto}
      >
        <span
          style={{
            ...estiloValorLinha,
            maxWidth: 160,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {resumo}
        </span>
        <Chevron aberto={aberto} />
      </Linha>
      <Expansivel aberto={aberto}>
        <div style={{ padding: "0 12px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {PAGAMENTOS.map((p) => {
              const sel = pagamento === p;
              return (
                <button
                  key={p}
                  className="opcao-suave"
                  onClick={() => escolherPag(p)}
                  aria-pressed={sel}
                  style={{
                    flex: 1,
                    padding: "8px 4px",
                    borderRadius: "var(--raio-controle)",
                    border: "none",
                    background: sel ? "var(--ink)" : "var(--card)",
                    color: sel ? "var(--bg)" : "var(--ink)",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <Icon name={iconePagamento(p)} size={16} color="currentColor" strokeWidth={2} />
                  {rotuloPag(p)}
                </button>
              );
            })}
          </div>

          <Expansivel aberto={mostrarCartoes}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {cartoes.map((c) => {
                const cor = corDoCartao(c);
                return (
                  <button
                    key={c.id}
                    className="opcao-suave"
                    onClick={() => escolherCartao(c.id)}
                    aria-pressed={cartaoId === c.id}
                    style={estiloPilulaCartao(cartaoId === c.id, cor)}
                  >
                    <Icon name="card" size={14} color="currentColor" strokeWidth={2.2} />
                    {c.nome}
                  </button>
                );
              })}
              {permitirSemCartao && (
                <button
                  className="opcao-suave"
                  onClick={() => escolherCartao(null)}
                  aria-pressed={cartaoId === null}
                  style={estiloPilulaCartao(cartaoId === null, "var(--ink)", true)}
                >
                  {t("Sem cartão")}
                </button>
              )}
            </div>
          </Expansivel>
        </div>
      </Expansivel>
    </>
  );
}

// ─── Diálogo ───────────────────────────────────────────────────────────────

// O círculo com o ícone no topo do diálogo.
export function IconeDialogo({ icone, cor = "var(--primary)", fundo }) {
  return (
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: "var(--raio-pilula)",
        background: fundo || `color-mix(in oklab, ${cor} 14%, transparent)`,
        margin: "0 auto 12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon name={icone} size={22} color={cor} strokeWidth={2.3} />
    </div>
  );
}

export function TituloDialogo({ titulo, mensagem }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>
        {titulo}
      </div>
      {mensagem && (
        <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500, marginTop: 6, lineHeight: 1.45 }}>
          {mensagem}
        </div>
      )}
    </div>
  );
}

// Os dois botões do pé do diálogo, em pílula — a mesma forma do Salvar dos
// formulários. `confirmar.cor` pinta a ação (vermelho no destrutivo).
export function BotoesDialogo({ cancelar, confirmar, style }) {
  const base = {
    flex: 1,
    minHeight: 44,
    padding: "11px 12px",
    borderRadius: "var(--raio-pilula)",
    border: "none",
    fontSize: 14,
    fontWeight: 800,
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  };
  const cor = confirmar?.cor || "var(--primary)";
  const confirmarAtivo = confirmar && !confirmar.disabled;
  return (
    <div style={{ display: "flex", gap: 10, marginTop: 18, ...style }}>
      {cancelar && (
        <button
          type="button"
          onClick={cancelar.onClick}
          disabled={cancelar.disabled}
          style={{
            ...base,
            background: "var(--card-2)",
            color: "var(--ink)",
            cursor: cancelar.disabled ? "default" : "pointer",
            opacity: cancelar.disabled ? 0.6 : 1,
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
          }}
        >
          {cancelar.texto}
        </button>
      )}
      {confirmar && (
        <button
          type={confirmar.type || "button"}
          onClick={confirmar.onClick}
          disabled={confirmar.disabled}
          style={{
            ...base,
            background: confirmarAtivo ? cor : "var(--linha)",
            color: confirmarAtivo ? "#fff" : "var(--muted)",
            cursor: confirmarAtivo ? "pointer" : "default",
            boxShadow: confirmarAtivo
              ? `0 4px 14px color-mix(in oklab, ${cor} 30%, transparent)`
              : "none",
          }}
        >
          {confirmar.icone && <Icon name={confirmar.icone} size={16} color="currentColor" strokeWidth={2.6} />}
          {confirmar.texto}
        </button>
      )}
    </div>
  );
}
