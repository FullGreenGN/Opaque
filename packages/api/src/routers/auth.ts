import { createHmac } from "node:crypto";

import prisma from "@opaque/db";
import { env } from "@opaque/env/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, publicProcedure, router } from "../index";
import { checkRateLimit } from "../rate-limit";

// Must match the client-side default in apps/web/src/lib/zero-knowledge.ts
// and apps/native/lib/zero-knowledge.ts.
const DEFAULT_ARGON2ID_PARAMS = {
	algorithm: "argon2id",
	memoryCostKib: 65536,
	iterations: 3,
	parallelism: 1,
} as const;

// Prisma's `Json` column type is a deeply recursive union, which blows up
// TypeScript's instantiation depth once it flows through tRPC's output
// inference into client components. Constraining the shape with a schema
// (rather than passing the raw Prisma type through) fixes that and adds
// real runtime validation, since keyDerivationParams is otherwise untyped
// at the DB layer.
const argon2idParamsSchema = z.object({
	algorithm: z.literal("argon2id"),
	memoryCostKib: z.number(),
	iterations: z.number(),
	parallelism: z.number(),
});

const keystoreSchema = z.object({
	publicKey: z.string(),
	encryptedPrivateKey: z.string(),
	keyDerivationSalt: z.string(),
	keyDerivationParams: argon2idParamsSchema,
	encryptionNonce: z.string(),
});

const myKeystoreSchema = keystoreSchema
	.extend({ createdAt: z.date() })
	.nullable();

function hmac(label: string, email: string) {
	return createHmac("sha256", env.BETTER_AUTH_SECRET)
		.update(`${label}:${email}`)
		.digest();
}

/**
 * Deterministically derives a keystore-shaped payload for an email with no
 * real keystore, so `getKeystore` always returns the same status code and
 * response shape whether or not the account/keystore exists. Without this,
 * the endpoint would be a user-enumeration oracle (NOT_FOUND vs 200) and
 * would leak whether a given email has real key material to attack offline.
 * The fake fields are stable per-email (same input always yields the same
 * output) so a legitimate client can't distinguish a fresh fake response from
 * a cached real one by re-querying.
 */
function fakeKeystoreFor(email: string) {
	return {
		publicKey: hmac("keystore-fake-pubkey", email).toString("base64"),
		encryptedPrivateKey: Buffer.concat([
			hmac("keystore-fake-privkey-a", email),
			hmac("keystore-fake-privkey-b", email),
		]).toString("base64"),
		keyDerivationSalt: hmac("keystore-fake-salt", email).toString("base64"),
		keyDerivationParams: DEFAULT_ARGON2ID_PARAMS,
		encryptionNonce: hmac("keystore-fake-nonce", email)
			.subarray(0, 24)
			.toString("base64"),
	};
}

export const authRouter = router({
	// Looks up the client-side encrypted keystore for a given account so the
	// client can re-derive the Argon2id master key and unwrap the private key
	// locally. The server only ever stores/returns ciphertext + KDF params.
	//
	// Rate-limited and uniform-response by design: this endpoint must not be
	// usable to enumerate registered emails or to selectively harvest real
	// encrypted-private-key blobs for offline attack. A real deployment should
	// replace this whole login flow with an aPAKE (e.g. OPAQUE) so the server
	// never releases wrapped key material before the client proves knowledge
	// of the password — this rate-limit + uniform-response pair is a stopgap,
	// not a substitute for that.
	getKeystore: publicProcedure
		.input(
			z.object({
				email: z.email(),
			}),
		)
		.output(keystoreSchema)
		.query(async ({ input, ctx }) => {
			const email = input.email.toLowerCase();

			if (!checkRateLimit(`keystore:email:${email}`, 5, 60_000)) {
				throw new TRPCError({
					code: "TOO_MANY_REQUESTS",
					message: "Too many requests. Try again shortly.",
				});
			}
			if (ctx.ip && !checkRateLimit(`keystore:ip:${ctx.ip}`, 20, 60_000)) {
				throw new TRPCError({
					code: "TOO_MANY_REQUESTS",
					message: "Too many requests. Try again shortly.",
				});
			}

			const user = await prisma.user.findUnique({
				where: { email },
				select: {
					keystore: {
						select: {
							publicKey: true,
							encryptedPrivateKey: true,
							keyDerivationSalt: true,
							keyDerivationParams: true,
							encryptionNonce: true,
						},
					},
				},
			});

			return keystoreSchema.parse(user?.keystore ?? fakeKeystoreFor(email));
		}),

	// Unlike getKeystore, this is safe to answer honestly (null when
	// unprovisioned) because the caller already proved who they are — there's
	// no enumeration risk in telling an authenticated user the truth about
	// their own account. The account/settings UI must use this, not
	// getKeystore, so it never mistakes a decoy for a real key bundle.
	getMyKeystore: protectedProcedure
		.output(myKeystoreSchema)
		.query(async ({ ctx }) => {
			const user = await prisma.user.findUnique({
				where: { id: ctx.session.user.id },
				select: {
					keystore: {
						select: {
							publicKey: true,
							encryptedPrivateKey: true,
							keyDerivationSalt: true,
							keyDerivationParams: true,
							encryptionNonce: true,
							createdAt: true,
						},
					},
				},
			});

			return myKeystoreSchema.parse(user?.keystore ?? null);
		}),

	// Creates the caller's keystore. Deliberately create-only: this is not a
	// key-rotation endpoint, so a keystore that already exists is left alone
	// rather than silently overwritten (which could brick the account's
	// existing messages or let a hijacked session replace legitimate key
	// material with the attacker's own).
	provisionKeystore: protectedProcedure
		.input(keystoreSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await prisma.encryptedKeystore.findUnique({
				where: { userId: ctx.session.user.id },
				select: { id: true },
			});

			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "A keystore already exists for this account",
				});
			}

			await prisma.encryptedKeystore.create({
				data: {
					userId: ctx.session.user.id,
					...input,
				},
			});
		}),
});
