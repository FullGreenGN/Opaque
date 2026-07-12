/**
 * Zero-knowledge key handling — client-side only.
 *
 * The server (packages/api, packages/db) never sees a raw password, a raw
 * private key, or plaintext message content. Everything in this module runs
 * on-device; only the outputs marked "safe to transmit" are ever sent to
 * `auth.getKeystore`/`auth.provisionKeystore`.
 *
 * Phase 1 (this file, as of now): identity keypair generation, Argon2id
 * master-key derivation, and XChaCha20-Poly1305 key wrapping/unwrapping are
 * real, via react-native-libsodium (a native binding matching the
 * libsodium-wrappers API — never hand-roll these primitives).
 *
 * IMPORTANT — unverified: react-native-libsodium is a native module. It
 * requires a custom dev-client rebuild (`expo prebuild` + a native build) to
 * actually run; it cannot execute in Expo Go, in a browser, or in this
 * sandbox. This file mirrors apps/web/src/lib/zero-knowledge.ts (which *is*
 * verified working) function-for-function, but has not itself been run on a
 * device or simulator. Test on a real dev-client build before trusting it.
 *
 * Phase 2 (not yet): message encryption/decryption (`encryptMessage`,
 * `decryptMessage` below) are still stubs — they intentionally throw rather
 * than silently no-op or fake it.
 */

import sodium from "react-native-libsodium";

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

let readyPromise: Promise<typeof sodium> | null = null;

/** On-device, this resolves near-instantly (no WASM to load) — awaited anyway for API parity with web. */
function getSodium(): Promise<typeof sodium> {
	if (!readyPromise) {
		readyPromise = sodium.ready.then(() => sodium);
	}
	return readyPromise;
}

const BASE64 = () => sodium.base64_variants.ORIGINAL;

/** A fresh random salt for Argon2id, base64-encoded for storage/transmission. */
export async function generateSalt(): Promise<string> {
	const s = await getSodium();
	return s.to_base64(s.randombytes_buf(s.crypto_pwhash_SALTBYTES), BASE64());
}

/** Generates an X25519 identity keypair on-device. Never leaves the device unwrapped. */
export async function generateIdentityKeyPair(): Promise<IdentityKeyPair> {
	const s = await getSodium();
	const { publicKey, privateKey } = s.crypto_box_keypair();
	return {
		publicKey: s.to_base64(publicKey, BASE64()),
		privateKey: s.to_base64(privateKey, BASE64()),
	};
}

/** Derives a 32-byte master key from the account password via Argon2id. */
export async function deriveMasterKey(
	password: string,
	salt: string,
	params: Argon2idParams = DEFAULT_ARGON2ID_PARAMS,
): Promise<Uint8Array> {
	const s = await getSodium();
	return s.crypto_pwhash(
		s.crypto_aead_xchacha20poly1305_ietf_KEYBYTES,
		password,
		s.from_base64(salt, BASE64()),
		params.iterations,
		params.memoryCostKib * 1024,
		s.crypto_pwhash_ALG_ARGON2ID13,
	);
}

/** Seals the identity private key with XChaCha20-Poly1305 using the Argon2id master key. */
export async function wrapPrivateKey(
	privateKey: string,
	masterKey: Uint8Array,
): Promise<WrappedPrivateKey> {
	const s = await getSodium();
	const nonce = s.randombytes_buf(
		s.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES,
	);
	const ciphertext = s.crypto_aead_xchacha20poly1305_ietf_encrypt(
		privateKey,
		null,
		null,
		nonce,
		masterKey,
	);
	return {
		encryptedPrivateKey: s.to_base64(ciphertext, BASE64()),
		encryptionNonce: s.to_base64(nonce, BASE64()),
	};
}

/** Opens a wrapped private key with the Argon2id master key. Throws if the key/password is wrong. */
export async function unwrapPrivateKey(
	wrapped: WrappedPrivateKey,
	masterKey: Uint8Array,
): Promise<string> {
	const s = await getSodium();
	const plaintext = s.crypto_aead_xchacha20poly1305_ietf_decrypt(
		null,
		s.from_base64(wrapped.encryptedPrivateKey, BASE64()),
		null,
		s.from_base64(wrapped.encryptionNonce, BASE64()),
		masterKey,
	);
	return s.to_base64(plaintext, BASE64());
}

/**
 * Derives the X25519 public key from a private key, for verifying an
 * unwrapped private key actually matches the account's known public key
 * (e.g. after a successful unwrap during sign-in).
 */
export async function publicKeyFromPrivateKey(
	privateKey: string,
): Promise<string> {
	const s = await getSodium();
	const derived = s.crypto_scalarmult_base(s.from_base64(privateKey, BASE64()));
	return s.to_base64(derived, BASE64());
}

/** Best-effort zeroing of key material once it's no longer needed. Not a guarantee in JS. */
export async function wipe(bytes: Uint8Array): Promise<void> {
	const s = await getSodium();
	s.memzero(bytes);
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
