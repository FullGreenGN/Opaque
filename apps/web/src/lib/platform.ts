import { isTauri } from "@tauri-apps/api/core";

/**
 * True when running inside the Tauri desktop shell (checks
 * `window.__TAURI_INTERNALS__` under the hood). Single choke point for this
 * check so the detection strategy only has to change in one place if it
 * ever needs to.
 */
export function isDesktopApp(): boolean {
	return isTauri();
}
