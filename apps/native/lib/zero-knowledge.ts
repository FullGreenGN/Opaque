/**
 * Zero-knowledge key handling — client-side only.
 *
 * The server (packages/api, packages/db) never sees a raw password, a raw
 * private key, or plaintext message content. Everything in this module runs
 * on-device; only the outputs marked "safe to transmit" are ever sent to
 * `auth.getKeystore` / a future keystore-provisioning mutation.
 *
 * Every function below is a scaffold: it defines the shape of the pipeline
 * and reports progress through `KeystoreBootstrapState`, but the actual
 * primitives (Argon2id, X25519, XChaCha20-Poly1305) are not wired in yet.
 * They should be implemented with a native crypto library (e.g.
 * react-native-libsodium) — never a hand-rolled cipher.
 */

export type KeystoreBootstrapState =
	| "idle"
	| "generating-keys"
	| "deriving-master-key"
	| "wrapping-private-key"
	| "done"
	| "error";

export interface IdentityKeyPair {
	publicKey: string;
	privateKey: string;
}

export interface Argon2idParams {
	algorithm: "argon2id";
	memoryCostKib: number;
	iterations: number;
	parallelism: number;
}

// Must match packages/api/src/routers/auth.ts's DEFAULT_ARGON2ID_PARAMS.
export const DEFAULT_ARGON2ID_PARAMS: Argon2idParams = {
	algorithm: "argon2id",
	memoryCostKib: 65536,
	iterations: 3,
	parallelism: 1,
};

export interface WrappedPrivateKey {
	encryptedPrivateKey: string;
	encryptionNonce: string;
}

/** TODO: generate an X25519 identity keypair on-device (e.g. react-native-libsodium `crypto_box_keypair`). */
export async function generateIdentityKeyPair(): Promise<IdentityKeyPair> {
	throw new Error(
		"generateIdentityKeyPair is not implemented — client-side crypto pending",
	);
}

/** TODO: derive a master key from the account password via Argon2id, using a fresh random salt. */
export async function deriveMasterKey(
	_password: string,
	_salt: string,
	_params: Argon2idParams = DEFAULT_ARGON2ID_PARAMS,
): Promise<Uint8Array> {
	throw new Error(
		"deriveMasterKey is not implemented — Argon2id derivation pending",
	);
}

/** TODO: seal the identity private key with XChaCha20-Poly1305 using the Argon2id master key. */
export async function wrapPrivateKey(
	_privateKey: string,
	_masterKey: Uint8Array,
): Promise<WrappedPrivateKey> {
	throw new Error(
		"wrapPrivateKey is not implemented — XChaCha20-Poly1305 sealing pending",
	);
}

/** TODO: open a wrapped private key with the Argon2id master key. */
export async function unwrapPrivateKey(
	_wrapped: WrappedPrivateKey,
	_masterKey: Uint8Array,
): Promise<string> {
	throw new Error(
		"unwrapPrivateKey is not implemented — XChaCha20-Poly1305 unsealing pending",
	);
}

/** TODO: seal outgoing message plaintext with the conversation's session key. */
export async function encryptMessage(
	_plaintext: string,
	_sessionKey: Uint8Array,
): Promise<{ ciphertext: string; nonce: string }> {
	throw new Error(
		"encryptMessage is not implemented — client-side sealing pending",
	);
}

/** TODO: open an incoming message ciphertext with the conversation's session key. */
export async function decryptMessage(
	_ciphertext: string,
	_nonce: string,
	_sessionKey: Uint8Array,
): Promise<string> {
	throw new Error(
		"decryptMessage is not implemented — client-side opening pending",
	);
}
