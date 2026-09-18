// firebase.js — o Firebase visto do SERVIDOR, sem o Admin SDK.
//
// O cliente fala com o Firestore pelo SDK web, preso às Security Rules. As
// funções da Vercel precisam do contrário: ler os dados de TODOS os usuários
// pra decidir quem recebe push, e passar por cima das regras. É o que a conta
// de serviço faz — e por isso ela é segredo de verdade (ao contrário da
// `firebaseConfig` do cliente) e só existe como variável de ambiente na
// Vercel, nunca no repositório.
//
// Mesmo desenho da função de push da cineteca (bib_filmes/api/push.ts): em vez
// do `firebase-admin` (dezenas de MB, cold start lento), o `jose` assina um
// JWT com a chave da conta de serviço, troca por um access token do Google e
// a gente fala com o Firestore por REST. É o menor servidor possível.
//
// FIREBASE_SERVICE_ACCOUNT: o JSON inteiro da conta de serviço, numa linha só
// (Console → Configurações do projeto → Contas de serviço → Gerar nova chave).

import { SignJWT, createRemoteJWKSet, importPKCS8, jwtVerify } from 'jose';

// ─── Conta de serviço ──────────────────────────────────────────────────────

let conta = null;

function contaDeServico() {
  if (conta) return conta;
  const bruto = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!bruto) throw new Error('FIREBASE_SERVICE_ACCOUNT não configurada');
  const json = JSON.parse(bruto);
  // Ao colar o JSON na Vercel a quebra de linha da chave privada às vezes
  // chega escapada de novo ("\\n"); o importPKCS8 precisa dela de verdade.
  if (typeof json.private_key === 'string') {
    json.private_key = json.private_key.replace(/\\n/g, '\n');
  }
  conta = json;
  return conta;
}

export function projeto() {
  return contaDeServico().project_id;
}

// Access token do Google pra conta de serviço, cacheado entre chamadas — a
// Vercel reaproveita o processo (warm start) e o token vale uma hora.
let tokenDeServico = null;

async function accessTokenDeServico() {
  if (tokenDeServico && tokenDeServico.expira > Date.now() + 60_000) return tokenDeServico.valor;
  const c = contaDeServico();
  const chave = await importPKCS8(c.private_key, 'RS256');
  const agora = Math.floor(Date.now() / 1000);
  const assertion = await new SignJWT({ scope: 'https://www.googleapis.com/auth/datastore' })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(c.client_email)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt(agora)
    .setExpirationTime(agora + 3600)
    .sign(chave);
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!r.ok) throw new Error(`token de serviço: ${r.status} ${await r.text()}`);
  const json = await r.json();
  tokenDeServico = { valor: json.access_token, expira: Date.now() + json.expires_in * 1000 };
  return tokenDeServico.valor;
}

// ─── Quem está pedindo ─────────────────────────────────────────────────────

// O JWKS do Firebase Auth; o `jose` cacheia por conta própria entre chamadas.
const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
);

// O uid de quem chamou, pelo ID token do Firebase no `Authorization: Bearer`.
// Null se não veio token ou ele não é deste projeto. A função nunca aceita um
// uid vindo do corpo da requisição — só o que está assinado no token.
export async function uidDoIdToken(req) {
  const cabecalho = req.headers.get('authorization') ?? '';
  const token = cabecalho.startsWith('Bearer ') ? cabecalho.slice(7) : '';
  if (!token) return null;
  try {
    const id = projeto();
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${id}`,
      audience: id,
    });
    return typeof payload.sub === 'string' && payload.sub ? payload.sub : null;
  } catch {
    return null;
  }
}

// ─── Firestore por REST ────────────────────────────────────────────────────
//
// A API REST não devolve JSON "normal": cada valor vem embrulhado no tipo
// ({ stringValue: 'x' }, { arrayValue: { values: [...] } }…). Os dois
// conversores abaixo tiram e põem o embrulho, cobrindo os tipos que o app
// grava. Referências, geopontos e bytes o app não usa e viram null.

function deValor(v) {
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.integerValue !== undefined) return Number(v.integerValue);
  if (v.doubleValue !== undefined) return v.doubleValue;
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.nullValue !== undefined) return null;
  if (v.timestampValue !== undefined) return v.timestampValue;
  if (v.arrayValue !== undefined) return (v.arrayValue.values || []).map(deValor);
  if (v.mapValue !== undefined) return deCampos(v.mapValue.fields);
  return null;
}

function deCampos(fields) {
  const out = {};
  for (const [k, v] of Object.entries(fields || {})) out[k] = deValor(v);
  return out;
}

function paraValor(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') {
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  }
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(paraValor) } };
  if (typeof v === 'object') return { mapValue: { fields: paraCampos(v) } };
  throw new Error(`valor sem representação no Firestore: ${typeof v}`);
}

function paraCampos(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) out[k] = paraValor(v);
  return out;
}

function raiz() {
  return `https://firestore.googleapis.com/v1/projects/${projeto()}/databases/(default)/documents`;
}

// "projects/x/databases/(default)/documents/pushSubs/abc" → "pushSubs/abc"
function caminhoDe(nome) {
  return nome.split('/documents/')[1];
}

// Uma chamada à API. 404 vira null (doc que não existe); qualquer outro erro
// lança com o status e o corpo, que é o que aparece no log da Vercel.
async function chamar(metodo, url, corpo) {
  const token = await accessTokenDeServico();
  const r = await fetch(url, {
    method: metodo,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`Firestore ${metodo} ${url.slice(raiz().length)}: ${r.status} ${await r.text()}`);
  return r.json();
}

// Lê um doc: devolve os dados, ou null se não existe.
export async function lerDoc(caminho) {
  const json = await chamar('GET', `${raiz()}/${caminho}`);
  return json ? deCampos(json.fields) : null;
}

// Lista uma coleção inteira, página a página: [{ caminho, dados }].
export async function listarColecao(colecao) {
  const docs = [];
  let pageToken = '';
  do {
    const url = `${raiz()}/${colecao}?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
    const json = (await chamar('GET', url)) || {};
    for (const d of json.documents || []) docs.push({ caminho: caminhoDe(d.name), dados: deCampos(d.fields) });
    pageToken = json.nextPageToken || '';
  } while (pageToken);
  return docs;
}

// Os docs de `colecao` em que `campo == valor`: [{ caminho, dados }].
export async function consultarPorCampo(colecao, campo, valor) {
  const json = await chamar('POST', `${raiz()}:runQuery`, {
    structuredQuery: {
      from: [{ collectionId: colecao }],
      where: { fieldFilter: { field: { fieldPath: campo }, op: 'EQUAL', value: paraValor(valor) } },
    },
  });
  // A resposta é uma lista de { document?, readTime }: sem resultado, vem um
  // item só com readTime.
  return (json || [])
    .filter((item) => item.document)
    .map((item) => ({ caminho: caminhoDe(item.document.name), dados: deCampos(item.document.fields) }));
}

// Atualiza só os campos passados (os outros ficam como estão).
export async function atualizarCampos(caminho, campos) {
  const mask = Object.keys(campos)
    .map((c) => `updateMask.fieldPaths=${encodeURIComponent(c)}`)
    .join('&');
  await chamar('PATCH', `${raiz()}/${caminho}?${mask}`, { fields: paraCampos(campos) });
}

// Apaga um doc. Best-effort: um doc que já não existe não é erro.
export async function apagarDoc(caminho) {
  try {
    await chamar('DELETE', `${raiz()}/${caminho}`);
  } catch (err) {
    console.warn('[firestore] não apagou', caminho, err?.message);
  }
}
