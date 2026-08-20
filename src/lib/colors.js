// colors.js — cores semânticas de feedback ao usuário.
// Usadas para indicar estado/significado (negativo, positivo, atenção) e
// reaproveitadas em toda a UI. Não confundir com as cores das categorias
// de gasto (essas vivem em data.js como atributo de cada categoria).
//
// Pares "fundo" são versões claras pra chips/botões/cards sutis.

export const COR_NEG = '#D63A55';        // erro, déficit, destrutivo
export const COR_POS = '#1B9E6A';        // sucesso, sobra, entrada
export const COR_AVISO = '#E08A00';      // atenção, alerta intermediário
export const COR_NEG_FUNDO = '#FFE5EA';  // fundo claro p/ NEG
export const COR_POS_FUNDO = '#DAF5E9';  // fundo claro p/ POS

// Sobre os cards de destaque (roxo, ou a cor da caixinha) o verde e o vermelho
// acima somem — ver ui/card-destaque.jsx. Estes são os equivalentes claros.
export const COR_POS_SOBRE = '#D9F5C8';       // sobra/entrada sobre cor
export const COR_NEG_SOBRE = '#FFD0D9';       // déficit/gasto sobre cor
// Mais saturado, pra área grande: um preenchimento de barra com o tom de texto
// acima ficaria lavado contra o trilho branco translúcido.
export const COR_NEG_SOBRE_FORTE = '#FFB1BD';
