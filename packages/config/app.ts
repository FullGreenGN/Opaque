/**
 * Single source of truth for user-facing branding. Safe to import at
 * runtime from web and native — this holds only display strings and asset
 * paths, never secrets.
 *
 * Icon/logo files still live per-app (apps/web, apps/native) since each
 * platform's build pipeline expects them at specific locations; the paths
 * below just point at those locations so there's one place to look them up.
 */

export const APP_NAME = "Opaque";
export const APP_TAGLINE = "End-to-end encrypted. Zero-knowledge. No metadata.";
export const APP_DESCRIPTION =
	"Opaque is an end-to-end encrypted messaging platform built for extreme privacy and zero-knowledge storage.";

export const webAssets = {
	favicon: "/favicon.ico",
} as const;

export const nativeAssets = {
	icon: "./assets/images/icon.png",
	favicon: "./assets/images/favicon.png",
	splash: "./assets/images/splash-icon.png",
	androidAdaptiveForeground: "./assets/images/android-icon-foreground.png",
	androidAdaptiveBackground: "./assets/images/android-icon-background.png",
	androidAdaptiveMonochrome: "./assets/images/android-icon-monochrome.png",
} as const;
