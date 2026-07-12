import { useCallback, useState } from "react";

import type { KeystoreBootstrapState } from "@/lib/zero-knowledge";

const STATUS_LABEL: Record<KeystoreBootstrapState, string> = {
	idle: "",
	"generating-keys": "Generating your encryption keys…",
	"deriving-master-key": "Deriving your master key (Argon2id)…",
	"wrapping-private-key": "Sealing your private key (XChaCha20-Poly1305)…",
	done: "Keys ready.",
	error: "Could not prepare your encryption keys.",
};

/**
 * Drives the UI through the client-side key-provisioning pipeline. The steps
 * below are placeholders — see `@/lib/zero-knowledge` — until the real
 * primitives and a keystore-provisioning tRPC mutation exist. Callers should
 * treat `run` as best-effort right now and continue their auth flow
 * regardless of outcome.
 */
export function useKeystoreBootstrap() {
	const [state, setState] = useState<KeystoreBootstrapState>("idle");

	const run = useCallback(async () => {
		try {
			setState("generating-keys");
			// TODO: await generateIdentityKeyPair()

			setState("deriving-master-key");
			// TODO: await deriveMasterKey(password, salt)

			setState("wrapping-private-key");
			// TODO: await wrapPrivateKey(privateKey, masterKey)
			// TODO: send { publicKey, encryptedPrivateKey, keyDerivationSalt,
			//   keyDerivationParams, encryptionNonce } to a future
			//   `auth.provisionKeystore` tRPC mutation — never the raw password
			//   or raw private key.

			setState("done");
		} catch {
			setState("error");
		}
	}, []);

	return {
		state,
		statusLabel: STATUS_LABEL[state],
		isBusy: state !== "idle" && state !== "done" && state !== "error",
		run,
	};
}
