# Opaque

End-to-end encrypted messaging, built for extreme privacy and zero-knowledge storage. Keys are generated and derived on-device, messages are sealed before they ever leave your device, and the server is designed to relay ciphertext it cannot read — no plaintext, no keys, no metadata it doesn't strictly need to route messages.

> **Project status: early scaffold.** The architecture, routing, database schema, and API surface described below are built and working. The actual client-side cryptography (key generation, Argon2id derivation, XChaCha20-Poly1305 sealing) is **not implemented yet** — see [Security status](#security-status--what-is-and-isnt-real-yet) before you rely on this for anything sensitive.

## What's here

- **Auth screens** (sign in / sign up) on web and mobile, backed by [Better Auth](https://www.better-auth.com/).
- **Chat dashboard**: conversation list, message thread, composer — on web (TanStack Router, split-pane) and mobile (Expo Router, push navigation).
- **Account/settings page**: cryptographic identity fingerprint, encrypted key bundle export, device session info.
- **Public landing page** with the project's zero-knowledge/zero-visibility/anti-surveillance pitch, plus a desktop-aware routing layer so the Tauri build skips straight to login or the dashboard instead.
- **A tRPC API** (`auth`, `chat` routers) shared type-safe across web, native, and the Fastify server.
- **A Prisma schema** modeling conversations, participants, encrypted messages, and per-user encrypted keystores — all designed so the server only ever stores/relays ciphertext.

## Tech stack

| Layer | Choice |
| --- | --- |
| Monorepo | Turborepo + pnpm workspaces |
| Web | React 19, TanStack Router (file-based), Tailwind CSS v4, Vite |
| Desktop | Tauri v2 (wraps the web app) |
| Mobile | Expo, Expo Router, React Native, Unistyles |
| API | tRPC v11, Fastify |
| Database | PostgreSQL, Prisma (multi-file schema) |
| Auth | Better Auth (email/password + Expo plugin) |
| Shared UI | Custom shadcn/ui-based chat kit (`packages/ui`) |
| Tooling | Biome (lint/format), TypeScript, Zod |

## Project structure

```
opaque/
├── apps/
│   ├── web/          # React + TanStack Router. Also the Tauri desktop shell (apps/web/src-tauri).
│   │   └── src/routes/
│   │       ├── index.tsx              # Public landing page (redirects away on desktop)
│   │       ├── login.tsx              # Sign in / sign up
│   │       └── _auth/                 # Session-guarded layout
│   │           ├── dashboard/         # Conversation list + thread (split-pane)
│   │           └── account.tsx        # Key fingerprint, export, device info
│   ├── native/       # Expo + Expo Router + Unistyles
│   │   └── app/
│   │       ├── login.tsx              # Public
│   │       └── (auth)/                # Session-guarded group
│   │           └── dashboard/         # Conversation list + thread (push navigation)
│   ├── server/       # Fastify host for the tRPC API + Better Auth
│   └── fumadocs/     # Documentation site scaffold (not yet populated)
├── packages/
│   ├── api/          # tRPC routers: auth (getKeystore, getMyKeystore), chat (getConversations, getMessages)
│   ├── auth/         # Better Auth configuration (Prisma adapter, Expo plugin)
│   ├── db/           # Prisma schema + generated client
│   ├── env/          # Typed env vars (t3-env), split server/web/native
│   ├── ui/           # Shared shadcn/ui-based components, including a chat UI kit (Bubble, Message, MessageScroller, ...)
│   └── config/       # Shared tsconfig base + app branding constants (name, tagline, asset paths)
```

## Getting started

Install dependencies:

```bash
pnpm install
```

### Database setup

This project uses PostgreSQL with Prisma, in a multi-file schema (`packages/db/prisma/schema/*.prisma`).

1. Have a PostgreSQL instance available (`pnpm run db:start` brings up the bundled `docker-compose.yml` Postgres service).
2. Set `DATABASE_URL` (and the other required vars — see `packages/env/src/server.ts`) in `apps/server/.env`.
3. Push the schema:

```bash
pnpm run db:push
```

### Run it

```bash
pnpm run dev
```

- Web: [http://localhost:3001](http://localhost:3001)
- API (Fastify + tRPC): [http://localhost:3000](http://localhost:3000)
- Native: open in Expo Go, an iOS/Android simulator, or `expo start --web`
- Docs (Fumadocs scaffold): [http://localhost:4000](http://localhost:4000)

### Desktop (Tauri)

```bash
cd apps/web
pnpm run desktop:dev    # dev build, wraps the Vite dev server
pnpm run desktop:build  # production bundle
```

The desktop build never shows the marketing landing page — `apps/web/src/lib/platform.ts` detects the Tauri runtime and the `/` route redirects immediately to `/login` or `/dashboard` depending on whether a session exists.

## Security status — what is, and isn't, real yet

Being direct about this matters more here than in most projects, given what the product claims to be.

**Built and working:**
- Standard Better Auth email/password authentication (passwords are hashed by Better Auth before storage — the server never sees or stores a raw password beyond the request lifecycle).
- A Prisma schema for per-user `EncryptedKeystore` rows (`publicKey`, `encryptedPrivateKey`, `keyDerivationSalt`, `keyDerivationParams`, `encryptionNonce`) and per-message ciphertext storage (`Message.ciphertext`, `nonce`) — the server-side data model assumes it only ever receives ciphertext.
- `auth.getKeystore`, the public endpoint a client queries pre-login to fetch KDF params: it's rate-limited (per-email and per-IP) and returns a **deterministic decoy** for unknown/unprovisioned accounts, so it can't be used to enumerate registered emails or selectively harvest real key material. `auth.getMyKeystore` is the authenticated counterpart used by the account page, which answers honestly since the caller has already proven who they are.

**Not built yet — currently placeholders:**
- Client-side key generation, Argon2id master-key derivation, and XChaCha20-Poly1305 key wrapping/unwrapping (`apps/web/src/lib/zero-knowledge.ts`, `apps/native/lib/zero-knowledge.ts` — every function throws `not implemented`, deliberately, rather than faking crypto).
- A mutation to actually provision a user's keystore — today, no account has a real one, so the account page and login flow correctly show empty/decoy states.
- Message encryption/decryption. The composer and message thread UI are wired up end-to-end through tRPC, but sending is stubbed (it warns and no-ops) rather than transmitting plaintext.

**Known limitation, tracked intentionally:** the current login flow still sends a password to a standard auth endpoint after fetching KDF params — it is not yet a real augmented PAKE (aPAKE). The eventual correct design is something like OPAQUE, where the server never releases wrapped key material before the client proves password knowledge. What's built today (rate limiting + uniform responses) is a deliberate stopgap, not a substitute for that.

If you're picking this up: the crypto pipeline is the load-bearing gap. Everything else — routing, auth guards, the tRPC contract, the DB shape — is built to slot a real implementation in without changing the surrounding architecture.

## UI customization

Web and native share visual language, but native (Unistyles) and web (Tailwind + `packages/ui`) are styled independently.

- Shared shadcn/ui primitives and chat components live in `packages/ui/src/components/*`.
- Design tokens and global styles: `packages/ui/src/styles/globals.css`.
- Shadcn aliases/config: `packages/ui/components.json` and `apps/web/components.json`.
- App branding (name, tagline, description, asset paths): `packages/config/app.ts` — imported at runtime by both web and native so copy stays in sync.

Add more shared primitives from the project root:

```bash
npx shadcn@latest add accordion dialog popover sheet table -c packages/ui
```

Import shared components like this:

```tsx
import { Button } from "@opaque/ui/components/button";
```

If you want app-specific blocks instead of shared primitives, run the shadcn CLI from `apps/web` directly.

## Deployment

### Docker Compose

- Target: web + server
- Config: `docker-compose.yml` (per-app Dockerfiles live in `apps/*/Dockerfile`)
- Build images: `pnpm run docker:build`
- Start: `pnpm run docker:up`
- Logs: `pnpm run docker:logs`
- Stop: `pnpm run docker:down`

Environment variables are read from each app's `.env` file (baked into web builds for public variables) and overridden in `docker-compose.yml` for container networking. Note the Docker Postgres service/database/container names still use the project's original `no-chat` identifier — only the npm package scope and user-facing branding were renamed to Opaque; renaming infra identifiers is a separate, higher-blast-radius change.

For more on the general pattern, see the guide on [Deploying with Docker Compose](https://www.better-t-stack.dev/docs/guides/docker).

## Available scripts

- `pnpm run dev` — start all apps in development mode
- `pnpm run build` — build all apps
- `pnpm run dev:web` / `dev:server` / `dev:native` — start a single app
- `pnpm run check-types` — TypeScript check across the monorepo
- `pnpm run check` — Biome format + lint
- `pnpm run db:push` / `db:generate` / `db:migrate` / `db:studio` — Prisma workflows
- `pnpm run db:start` / `db:watch` / `db:stop` / `db:down` — bundled Postgres via Docker Compose
- `cd apps/web && pnpm run desktop:dev` / `desktop:build` — Tauri desktop app
- `pnpm run docker:build` / `docker:up` / `docker:logs` / `docker:down` — full Docker Compose stack

## Attribution

Originally scaffolded with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack).
