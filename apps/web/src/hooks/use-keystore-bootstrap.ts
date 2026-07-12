import { useCallback, useState } from "react";

import {
	DEFAULT_ARGON2ID_PARAMS,
	deriveMasterKey,
	generateIdentityKeyPair,
	generateSalt,
	type KeystoreBootstrapState,
	wipe,
	wrapPrivateKey,
} from "@/lib/zero-knowledge";

const STATUS_LABEL: Record<KeystoreBootstrapState, string> = {
	idle: "",
	"generating-keys": "Generating your encryption keys…",
	"deriving-master-key": "Deriving your master key (Argon2id)…",
	"wrapping-private-key": "Sealing your private key (XChaCha20-Poly1305)…",
	done: "Keys ready.",
	error: "Could not prepare your encryption keys.",
};

export interface KeystoreProvisionPayload {
	publicKey: string;
	encryptedPrivateKey: string;
	keyDerivationSalt: string;
	keyDerivationParams: typeof DEFAULT_ARGON2ID_PARAMS;
	encryptionNonce: string;
}

/**
 * Drives the UI through the client-side key-provisioning pipeline: generate
 * an identity keypair, derive a master key from the password via Argon2id,
 * and wrap the private key with it. Throws (and sets state to "error") if
 * any step fails — callers should abort sign-up rather than create an
 * account with no way to add a keystore afterward.
 */
export function useKeystoreBootstrap() {
	const [state, setState] = useState<KeystoreBootstrapState>("idle");

	const run = useCallback(
		async (password: string): Promise<KeystoreProvisionPayload> => {
			try {
				setState("generating-keys");
				const keyPair = await generateIdentityKeyPair();

				setState("deriving-master-key");
				const salt = await generateSalt();
				const masterKey = await deriveMasterKey(
					password,
					salt,
					DEFAULT_ARGON2ID_PARAMS,
				);

				setState("wrapping-private-key");
				const wrapped = await wrapPrivateKey(keyPair.privateKey, masterKey);
				await wipe(masterKey);

				setState("done");
				return {
					publicKey: keyPair.publicKey,
					encryptedPrivateKey: wrapped.encryptedPrivateKey,
					keyDerivationSalt: salt,
					keyDerivationParams: DEFAULT_ARGON2ID_PARAMS,
					encryptionNonce: wrapped.encryptionNonce,
				};
			} catch (error) {
				setState("error");
				throw error;
			}
		},
		[],
	);

	return {
		state,
		statusLabel: STATUS_LABEL[state],
		isBusy: state !== "idle" && state !== "done" && state !== "error",
		run,
	};
}
