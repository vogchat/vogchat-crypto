'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const nodeCrypto = require('node:crypto');
const { loadVogCrypto } = require('./load');

const vc = loadVogCrypto();
const VERSION = 'vogchat-e2e-v1';

const b64url = (buf) => Buffer.from(buf).toString('base64url');
const fromB64url = (s) => new Uint8Array(Buffer.from(s, 'base64url'));

// Independent re-implementation with Node's own crypto (not WebCrypto), straight from the spec in
// WHITEPAPER.md section 3. If src/crypto.js ever drifts from the documented design, these disagree.
function referenceDerive(roomCode, password) {
  const salt = Buffer.from(`${VERSION}|${roomCode.toUpperCase()}`, 'utf8');
  const master = nodeCrypto.pbkdf2Sync(Buffer.from(password.normalize('NFKC'), 'utf8'), salt, 300000, 32, 'sha256');
  const sub = (label) => Buffer.from(nodeCrypto.hkdfSync('sha256', master, Buffer.alloc(32), Buffer.from(`${VERSION}|${label}`, 'utf8'), 32));
  return { authKey: b64url(sub('auth')), encKeyRaw: b64url(sub('enc')) };
}

// Known-answer vectors. Changing the key derivation in any way breaks these on purpose:
// existing rooms would stop opening, so a change needs a new protocol version.
const VECTORS = [
  { code: 'XJLRY69A', password: 'sunflower', authKey: 'sqJh3x3qxw4Sx-27IKgo-PZBP9quob5F7X6A20zeCPY', encKeyRaw: 'deHy6IWC70u9IAtNTFuMbHyXRnt5CpuFytVNrK-GF24' },
  { code: '6SLHC4EH', password: 'hedgehog', authKey: '3bwmTim6EtL4aNpANb3PLLvXgbyyFPJCAyQ2HwCwUck', encKeyRaw: 'F4G0wR8g-st2YBdfW7U-9EkNgEFUfYAWXk-CBshFPC8' },
  { code: 'ABCDEFGH', password: 'Çiçek', authKey: 'jvX7Nm0VQnVHVXLBKHH9IeUeIjnlPhTJyCoyywaNH9U', encKeyRaw: 'u7q6nB6K-9mwT_FlkYZQAqukbR8z3zFHxoHFOOuFisw' },
];

test('exports the documented API', () => {
  assert.deepEqual(Object.keys(vc).sort(), ['available', 'decrypt', 'deriveKeys', 'encrypt', 'importKey']);
  assert.equal(vc.available(), true);
});

test('key derivation matches the known-answer vectors', async () => {
  for (const v of VECTORS) {
    const keys = await vc.deriveKeys(v.code, v.password);
    assert.equal(keys.authKey, v.authKey, `authKey for ${v.code}`);
    assert.equal(keys.encKeyRaw, v.encKeyRaw, `encKeyRaw for ${v.code}`);
  }
});

test('key derivation matches an independent implementation (node:crypto)', async () => {
  for (const [code, password] of [['XJLRY69A', 'sunflower'], ['K7M2Q9PZ', 'Lighthouse'], ['ABCDEFGH', 'Çiçek'], ['ZZZZZZZZ', 'ねこ']]) {
    const { authKey, encKeyRaw } = await vc.deriveKeys(code, password);
    assert.deepEqual({ authKey, encKeyRaw }, referenceDerive(code, password));
  }
});

test('both keys are 32 bytes, base64url without padding, and independent of each other', async () => {
  const { authKey, encKeyRaw } = await vc.deriveKeys('XJLRY69A', 'sunflower');
  for (const k of [authKey, encKeyRaw]) {
    assert.match(k, /^[A-Za-z0-9_-]{43}$/);
    assert.equal(fromB64url(k).length, 32);
  }
  assert.notEqual(authKey, encKeyRaw);
});

test('the room code acts as salt: same password in another room gives other keys', async () => {
  const a = await vc.deriveKeys('XJLRY69A', 'sunflower');
  const b = await vc.deriveKeys('XJLRY69B', 'sunflower');
  assert.notEqual(a.authKey, b.authKey);
  assert.notEqual(a.encKeyRaw, b.encKeyRaw);
});

test('room code is case-insensitive, password is case-sensitive', async () => {
  assert.deepEqual(await vc.deriveKeys('xjlry69a', 'sunflower'), await vc.deriveKeys('XJLRY69A', 'sunflower'));
  assert.notDeepEqual(await vc.deriveKeys('XJLRY69A', 'Sunflower'), await vc.deriveKeys('XJLRY69A', 'sunflower'));
});

test('passwords are NFKC-normalised, so the same word typed on different keyboards matches', async () => {
  const fullWidth = 'ｓｕｎ'; // "ｓｕｎ"
  assert.deepEqual(await vc.deriveKeys('XJLRY69A', fullWidth), await vc.deriveKeys('XJLRY69A', 'sun'));
  const decomposed = 'Çiçek'; // "Çiçek" written with combining cedillas
  assert.deepEqual(await vc.deriveKeys('ABCDEFGH', decomposed), await vc.deriveKeys('ABCDEFGH', 'Çiçek'));
});

test('encrypt/decrypt round trip, including emoji and a photo-sized payload', async () => {
  const key = await vc.importKey(VECTORS[0].encKeyRaw);
  for (const text of ['Hi! Coffee at 5?', 'Görüşürüz 👋 ✨', 'x'.repeat(1_500_000), '']) {
    assert.equal(await vc.decrypt(key, await vc.encrypt(key, text)), text);
  }
});

test('ciphertext format is base64url(iv[12] || ciphertext || tag[16])', async () => {
  const key = await vc.importKey(VECTORS[0].encKeyRaw);
  const text = 'Hi! Coffee at 5?';
  const payload = await vc.encrypt(key, text);
  assert.match(payload, /^[A-Za-z0-9_-]+$/);
  assert.equal(fromB64url(payload).length, 12 + Buffer.byteLength(text) + 16);
});

test('decrypts with an independent AES-256-GCM implementation (node:crypto)', async () => {
  const key = await vc.importKey(VECTORS[0].encKeyRaw);
  const all = Buffer.from(await vc.encrypt(key, 'Hi! Coffee at 5?'), 'base64url');
  const d = nodeCrypto.createDecipheriv('aes-256-gcm', Buffer.from(VECTORS[0].encKeyRaw, 'base64url'), all.subarray(0, 12));
  d.setAuthTag(all.subarray(all.length - 16));
  assert.equal(Buffer.concat([d.update(all.subarray(12, all.length - 16)), d.final()]).toString('utf8'), 'Hi! Coffee at 5?');
});

test('a fresh random IV is used for every message', async () => {
  const key = await vc.importKey(VECTORS[0].encKeyRaw);
  const ivs = new Set();
  for (let i = 0; i < 200; i++) ivs.add(b64url(fromB64url(await vc.encrypt(key, 'same text')).subarray(0, 12)));
  assert.equal(ivs.size, 200);
});

test('any change to the ciphertext is rejected (authenticated encryption)', async () => {
  const key = await vc.importKey(VECTORS[0].encKeyRaw);
  const bytes = fromB64url(await vc.encrypt(key, 'Hi! Coffee at 5?'));
  for (const pos of [0, 11, 12, bytes.length - 17, bytes.length - 1]) {
    const tampered = bytes.slice();
    tampered[pos] ^= 0x01;
    await assert.rejects(vc.decrypt(key, b64url(tampered)), `bit flip at byte ${pos}`);
  }
  await assert.rejects(vc.decrypt(key, b64url(bytes.subarray(0, bytes.length - 1))), 'truncated');
});

test('a wrong password cannot decrypt', async () => {
  const right = await vc.importKey((await vc.deriveKeys('XJLRY69A', 'sunflower')).encKeyRaw);
  const wrong = await vc.importKey((await vc.deriveKeys('XJLRY69A', 'sunflowers')).encKeyRaw);
  await assert.rejects(vc.decrypt(wrong, await vc.encrypt(right, 'Hi! Coffee at 5?')));
});

test('the encryption key cannot be exported from WebCrypto', async () => {
  const key = await vc.importKey(VECTORS[0].encKeyRaw);
  assert.equal(key.extractable, false);
  assert.deepEqual([...key.usages].sort(), ['decrypt', 'encrypt']);
});
