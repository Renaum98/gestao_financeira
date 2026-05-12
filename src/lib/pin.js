// pin.js — PIN local de 4 dígitos (gateia a UI, independente do Firebase).
//
// Armazenamento: localStorage["pin_hash"] = SHA-256(pin + salt).
// O salt é gerado uma vez por dispositivo. Isso impede que alguém com acesso
// ao localStorage decifre o PIN trivialmente; não é alta segurança, mas é
// suficiente para gateamento local.

const KEY_HASH = 'finca.pin.hash';
const KEY_SALT = 'finca.pin.salt';

function randomSalt() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256(text) {
  const buf = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function hasPin() {
  return !!localStorage.getItem(KEY_HASH);
}

export async function setPin(pin) {
  const salt = randomSalt();
  const hash = await sha256(pin + salt);
  localStorage.setItem(KEY_SALT, salt);
  localStorage.setItem(KEY_HASH, hash);
}

export async function verifyPin(pin) {
  const salt = localStorage.getItem(KEY_SALT);
  const expected = localStorage.getItem(KEY_HASH);
  if (!salt || !expected) return false;
  const hash = await sha256(pin + salt);
  return hash === expected;
}

export function clearPin() {
  localStorage.removeItem(KEY_HASH);
  localStorage.removeItem(KEY_SALT);
}
