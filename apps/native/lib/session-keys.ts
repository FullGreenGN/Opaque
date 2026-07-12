/**
 * Holds the unwrapped identity private key for the current app session only.
 * Never persisted (no SecureStore/AsyncStorage) and never sent anywhere —
 * this is purely so a later feature (message encryption) has something to
 * read without re-deriving the master key on every action. Cleared on
 * sign-out; also gone on app kill/restart, by design.
 */

let identityPrivateKey: string | null = null;

export function setIdentityPrivateKey(privateKey: string): void {
	identityPrivateKey = privateKey;
}

export function getIdentityPrivateKey(): string | null {
	return identityPrivateKey;
}

export function clearIdentityPrivateKey(): void {
	identityPrivateKey = null;
}
