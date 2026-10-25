# Contributing

Thanks for taking the time to look at VogChat's encryption. Reviews, questions and corrections are all welcome.

## Good ways to help

- **Review the design.** Read the [whitepaper](WHITEPAPER.md) and open an issue if something is unclear, wrong, or weaker than it should be.
- **Add tests.** More test vectors, edge cases, or a reference implementation in another language.
- **Improve the docs.** Clearer explanations help everyone check our claims.

Security vulnerabilities go through [private reporting](SECURITY.md), not public issues.

## Changing `src/crypto.js`

This file is served byte for byte by vogchat.com and used by the iOS app, and a daily check compares it with the live site. So:

- Any change to key derivation or the ciphertext format is a **protocol change**: existing rooms would stop opening. It needs a new version string (`vogchat-e2e-v2`) and a migration plan. Please open an issue to discuss it first.
- Do not reformat the file or change its line endings.
- `npm test` must pass, and the known-answer vectors must not change unless the protocol version changes.

## Pull requests

1. Fork the repository and create a branch.
2. Make your change and run `npm test` (Node.js 20 or newer).
3. Explain **what** you changed and **why** in the pull request.

By contributing, you agree that your contributions are licensed under the [Apache License 2.0](LICENSE).
