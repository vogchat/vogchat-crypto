# Security Policy

VogChat's privacy depends on this code being correct, so we take reports seriously and are grateful for them.

## Reporting a vulnerability

**Please do not open a public issue.** Report privately through GitHub:

1. Go to the [Security tab](https://github.com/vogchat/vogchat-crypto/security) of this repository.
2. Click **Report a vulnerability**.

If you cannot use GitHub, e-mail **security@vogchat.com** instead.

Please include what you found, how to reproduce it, and what an attacker could do with it. A proof of concept helps a lot.

## What happens next

- We confirm receipt within **3 working days**.
- We keep you updated while we investigate and fix the issue.
- Once a fix is live, we publish an advisory and credit you, unless you prefer to stay anonymous.

Please give us a reasonable time to fix the problem before you disclose it publicly.

## Scope

In scope:

- `src/crypto.js` and the protocol described in [WHITEPAPER.md](WHITEPAPER.md)
- Differences between this repository and the code served at `https://vogchat.com/crypto.js`
- Places where VogChat's behaviour contradicts the whitepaper

Already documented (see section 9 of the whitepaper), so not new findings on their own:

- Offline guessing of short room passwords by someone who controls the server
- Missing forward secrecy
- Metadata visible to the server (nicknames, reactions, online times)
- Replay of earlier ciphertexts by the server (section 9.6)
- Exposure of remembered passwords on the web through an XSS bug (section 4)

## Supported versions

| Protocol | Supported |
| --- | --- |
| `vogchat-e2e-v1` | ✅ |
