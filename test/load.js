// Loads src/crypto.js exactly as a browser would (a plain <script>), using Node's WebCrypto.
// The file is not modified or wrapped, so the tests run the same bytes that vogchat.com serves.
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');

const SOURCE_PATH = path.join(__dirname, '..', 'src', 'crypto.js');

function loadVogCrypto() {
  const source = fs.readFileSync(SOURCE_PATH, 'utf8');
  const window = { crypto: webcrypto, isSecureContext: true };
  const context = vm.createContext({ window, TextEncoder, TextDecoder, btoa, atob, Uint8Array });
  vm.runInContext(source, context, { filename: 'src/crypto.js' });
  return window.vogCrypto;
}

module.exports = { loadVogCrypto, SOURCE_PATH };
