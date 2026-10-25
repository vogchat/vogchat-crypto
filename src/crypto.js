// VogChat end-to-end encryption (WebCrypto).
//
// From the room password (+ room code as salt) the device derives:
//   - authKey: sent to the server instead of the password (server stores only its hash)
//   - encKey : AES-256-GCM key that never leaves the device
// Messages, photos, reply quotes and meeting times are encrypted with encKey;
// the server only ever sees base64url(iv || ciphertext).
(function () {
    'use strict';

    const enc = new TextEncoder();
    const dec = new TextDecoder();
    const ITERATIONS = 300000;
    const VERSION = 'vogchat-e2e-v1';

    function b64url(bytes) {
        let bin = '';
        const chunk = 0x8000;
        for (let i = 0; i < bytes.length; i += chunk) {
            bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
        }
        return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    function unb64url(str) {
        const s = str.replace(/-/g, '+').replace(/_/g, '/');
        const bin = atob(s + '==='.slice((s.length + 3) % 4));
        const out = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
        return out;
    }

    function available() {
        return !!(window.crypto && window.crypto.subtle && window.isSecureContext !== false);
    }

    // Password → { authKey, encKeyRaw } (both base64url, 32 bytes)
    async function deriveKeys(roomCode, password) {
        const subtle = window.crypto.subtle;
        const pw = await subtle.importKey('raw', enc.encode(password.normalize('NFKC')), 'PBKDF2', false, ['deriveBits']);
        const master = new Uint8Array(await subtle.deriveBits(
            { name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(`${VERSION}|${roomCode.toUpperCase()}`), iterations: ITERATIONS },
            pw, 256));
        const hk = await subtle.importKey('raw', master, 'HKDF', false, ['deriveBits']);
        const sub = async (label) => new Uint8Array(await subtle.deriveBits(
            { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: enc.encode(`${VERSION}|${label}`) }, hk, 256));
        return { authKey: b64url(await sub('auth')), encKeyRaw: b64url(await sub('enc')) };
    }

    async function importKey(encKeyRaw) {
        return window.crypto.subtle.importKey('raw', unb64url(encKeyRaw), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
    }

    async function encrypt(key, text) {
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const ct = new Uint8Array(await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(text)));
        const out = new Uint8Array(iv.length + ct.length);
        out.set(iv, 0);
        out.set(ct, iv.length);
        return b64url(out);
    }

    async function decrypt(key, payload) {
        const all = unb64url(payload);
        const pt = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv: all.subarray(0, 12) }, key, all.subarray(12));
        return dec.decode(pt);
    }

    window.vogCrypto = { available, deriveKeys, importKey, encrypt, decrypt };
})();
