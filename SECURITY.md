# Security Policy

Opaque is a pre-release, early-stage project. Please read this before reporting — it tells you what's already a known gap versus what's an actual vulnerability worth reporting.

## Project security status

The product's pitch is end-to-end encryption and zero-knowledge storage, but the client-side cryptography is **not implemented yet**. See the [Security status](./README.md#security-status--what-is-and-isnt-real-yet) section of the README for the full breakdown of what's built versus placeholder. In short:

- Key generation, Argon2id derivation, and XChaCha20-Poly1305 sealing/unsealing are stubbed and throw `not implemented` — they are not silently faked.
- No message content is actually encrypted yet; the composer/send path is a no-op stopgap.
- Login is not yet a real aPAKE (e.g. OPAQUE) — the server still sees a password during authentication, mitigated for now by rate limiting and a uniform/decoy response on the pre-login keystore lookup, not by removing the exposure entirely.

**Please don't file reports for the gaps above** — they're tracked, intentional, and already documented. Reports about "messages aren't actually encrypted" or "the crypto functions throw errors" will be closed as known/duplicate.

## Supported versions

| Version | Supported |
| --- | --- |
| `0.1.x` (current, pre-release) | :white_check_mark: |

There is no stable release yet. Security fixes land on `main`; there is no long-term-support branch to backport to at this stage.

## Reporting a vulnerability

Please use **[GitHub's private vulnerability reporting](https://github.com/FullGreenGN/Opaque/security/advisories/new)** (repo → Security tab → "Report a vulnerability") rather than a public issue. This keeps the report private between you and the maintainer until a fix is ready.

If that's unavailable for some reason, open a regular GitHub issue with minimal detail and a request for a private channel — don't post exploit details or proof-of-concept payloads in a public issue.

When reporting, please include:
- What you found and where (file/route/procedure name if you have it)
- Steps to reproduce, or a minimal proof of concept
- What you think the impact is (e.g. data exposure, auth bypass, privilege escalation)

There is no bug bounty program. This is a solo/early-stage project, so response times are best-effort, not SLA-backed — but reports will be read and taken seriously.

## In scope

Anything that isn't a documented placeholder above, especially:
- Authentication and session handling (`packages/auth`, Better Auth configuration)
- The tRPC API surface (`packages/api/src/routers/*`) — authorization checks, input validation, rate limiting
- The `auth.getKeystore` / `auth.getMyKeystore` endpoints specifically — enumeration, decoy-response distinguishability, rate-limit bypass
- Database access patterns (`packages/db`) — e.g. IDOR on conversations/messages, missing ownership checks
- Anything that lets one account read, modify, or impersonate another account's data

## Disclosure

Please give a reasonable window to land a fix before any public disclosure. Coordinated disclosure is appreciated; credit will be given in the fix's commit/release notes unless you'd prefer to stay anonymous.
