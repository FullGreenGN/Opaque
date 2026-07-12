import { createHmac } from "node:crypto";

import prisma from "@opaque/db";
import { env } from "@opaque/env/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { publicProcedure, router } from "../index";
import { checkRateLimit } from "../rate-limit";

// Must match the client-side default in apps/web/src/lib/zero-knowledge.ts
// and apps/native/lib/zero-knowledge.ts.
const DEFAULT_ARGON2ID_PARAMS = {
	algorithm: "argon2id",
	memoryCostKib: 65536,
	iterations: 3,
	parallelism: 1,
} as const;

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

			return user?.keystore ?? fakeKeystoreFor(email);
		}),
});
