// atividade-caixinhas.js — o que um membro da parceria fez nas caixinhas
// compartilhadas, pro outro ficar sabendo.
//
// Quem mexe grava um evento em `partnerships/{pId}.atividade`, junto da própria
// mudança. Antes o aviso nascia de comparar uma snapshot com a anterior — só
// funcionava com o app do outro ABERTO: o que o parceiro fazia enquanto ele
// estava fechado virava "estado conhecido" na primeira snapshot e sumia. Com o
// registro no doc, dá pra recuperar depois:
//   • o app, ao abrir, traz pra `notificacoesParceria` o que for novo;
//   • o cron do push (api/push/enviar.js) avisa o que o app ainda não trouxe.
// O marco entre os dois é `users/{uid}.atividadeParceriaVista`: a data do
// evento mais recente que o app já trouxe pra dentro.
//
// Módulo puro (sem Firebase nem React) porque o servidor importa também.

// Quanto tempo um evento fica no registro. Passado isso nem o app nem o push
// avisam mais — é notícia velha, e o doc não cresce pra sempre.
export const DIAS_ATIVIDADE = 3;
const MAX_EVENTOS = 40;

export function novaAtividade({ tipo, por, cx, valor }) {
  const ev = {
    id: `at-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tipo,
    por,
    caixinhaId: cx.id,
    caixinhaNome: cx.nome || "",
    em: new Date().toISOString(),
  };
  if (valor > 0) ev.valor = valor;
  return ev;
}

function limite(agora = new Date()) {
  return new Date(agora.getTime() - DIAS_ATIVIDADE * 24 * 60 * 60 * 1000).toISOString();
}

// Registro depois de acrescentar `ev`: só o que ainda está no prazo.
export function podarAtividade(lista, ev) {
  const desde = limite();
  const vivos = (lista || []).filter((e) => e.em > desde);
  if (ev) vivos.push(ev);
  return vivos.slice(-MAX_EVENTOS);
}

// Eventos do parceiro mais novos que `vista` (ISO) e ainda no prazo.
export function atividadeDoParceiro(lista, meuUid, vista) {
  const desde = vista && vista > limite() ? vista : limite();
  return (lista || []).filter((e) => e.por !== meuUid && e.em > desde);
}

// Formato da lista `notificacoesParceria` (NotifParceriaItem). Determinístico:
// dois aparelhos trazendo o mesmo evento geram o mesmo objeto, e o
// `arrayUnion` não duplica.
export function paraNotifParceria(ev, nomeParceiro) {
  const n = {
    id: `np-${ev.id}`,
    tipo: ev.tipo,
    por: nomeParceiro || "Seu parceiro",
    caixinhaNome: ev.caixinhaNome,
    em: ev.em,
  };
  if (ev.valor > 0) n.valor = ev.valor;
  return n;
}

// Título e corpo do push. `t` traduz, `fmt` formata dinheiro — o servidor
// passa as versões com o idioma e a moeda de cada usuário.
export function textoAtividade(ev, nomeParceiro, t, fmt) {
  const por = nomeParceiro || t("Seu parceiro");
  const nome = ev.caixinhaNome;
  switch (ev.tipo) {
    case "caixinha-criada":
      return { titulo: t("{por} criou uma caixinha", { por }), corpo: `"${nome}"` };
    case "caixinha-deposito":
      return {
        titulo: t("{por} depositou {x}", { por, x: fmt(ev.valor) }),
        corpo: t('Na caixinha "{nome}"', { nome }),
      };
    case "caixinha-saque":
      return {
        titulo: t("{por} retirou {x}", { por, x: fmt(ev.valor) }),
        corpo: t('Na caixinha "{nome}"', { nome }),
      };
    case "caixinha-excluida":
      return { titulo: t("{por} excluiu uma caixinha", { por }), corpo: `"${nome}"` };
    case "caixinha-editada":
    default:
      return { titulo: t("{por} editou uma caixinha", { por }), corpo: `"${nome}"` };
  }
}
