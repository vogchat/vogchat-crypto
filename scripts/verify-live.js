#!/usr/bin/env node
// Checks that the encryption code vogchat.com serves right now is byte-for-byte the file in this repo.
//   node scripts/verify-live.js
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const LIVE_URL = 'https://vogchat.com/crypto.js';
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

(async () => {
  const local = fs.readFileSync(path.join(__dirname, '..', 'src', 'crypto.js'));
  const res = await fetch(LIVE_URL, { cache: 'no-store' });
  if (!res.ok) {
    console.error(`Could not fetch ${LIVE_URL}: HTTP ${res.status}`);
    process.exit(2);
  }
  const live = Buffer.from(await res.arrayBuffer());

  console.log(`repo  src/crypto.js  sha256 ${sha256(local)}`);
  console.log(`live  ${LIVE_URL}  sha256 ${sha256(live)}`);
  if (!live.equals(local)) {
    console.error('\nMISMATCH: the live site is serving different code than this repository.');
    process.exit(1);
  }
  console.log('\nOK: the live site serves exactly the code in this repository.');
})();
