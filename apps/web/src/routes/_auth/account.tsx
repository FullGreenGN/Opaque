import { Button } from "@opaque/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@opaque/ui/components/card";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	DownloadIcon,
	KeyRoundIcon,
	LaptopIcon,
	TriangleAlertIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/account")({
	component: AccountPage,
});

async function fingerprintOf(publicKeyBase64: string): Promise<string> {
	const digest = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(publicKeyBase64),
	);
	const hex = Array.from(new Uint8Array(digest))
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
	return (hex.match(/.{1,4}/g) ?? []).join(" ").toUpperCase();
}

function downloadJson(filename: string, data: unknown) {
	const blob = new Blob([JSON.stringify(data, null, 2)], {
		type: "application/json",
	});
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
}

function AccountPage() {
	const { session } = Route.useRouteContext();
	const keystoreQuery = useQuery(trpc.auth.getMyKeystore.queryOptions());
	const keystore = keystoreQuery.data;
	const [fingerprint, setFingerprint] = useState<string | null>(null);

	useEffect(() => {
		if (!keystore?.publicKey) {
			setFingerprint(null);
			return;
		}
		let cancelled = false;
		fingerprintOf(keystore.publicKey).then((value) => {
			if (!cancelled) {
				setFingerprint(value);
			}
		});
		return () => {
			cancelled = true;
		};
	}, [keystore?.publicKey]);

	const handleExport = () => {
		if (!keystore) {
			return;
		}
		const bundle = {
			email: session.data?.user.email,
			publicKey: keystore.publicKey,
			encryptedPrivateKey: keystore.encryptedPrivateKey,
			keyDerivationSalt: keystore.keyDerivationSalt,
			keyDerivationParams: keystore.keyDerivationParams,
			encryptionNonce: keystore.encryptionNonce,
			exportedAt: new Date().toISOString(),
		};
		downloadJson(`opaque-key-bundle-${session.data?.user.email}.json`, bundle);
		toast.success("Key bundle downloaded");
	};

	return (
		<div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
			<div>
				<h1 className="font-semibold text-xl">Account</h1>
				<p className="text-muted-foreground text-sm">
					{session.data?.user.name} · {session.data?.user.email}
				</p>
			</div>

			<Card>
				<CardHeader>
					<div className="mb-2 flex size-9 items-center justify-center rounded-full bg-muted">
						<KeyRoundIcon className="size-4" />
					</div>
					<CardTitle>Cryptographic identity</CardTitle>
					<CardDescription>
						Your identity key never leaves your device unencrypted. This is a
						fingerprint of your public key only.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{keystoreQuery.isLoading ? (
						<p className="text-muted-foreground text-sm">Loading…</p>
					) : keystore && fingerprint ? (
						<div className="space-y-3">
							<div className="break-all border border-border p-3 font-mono text-xs tracking-wider">
								{fingerprint}
							</div>
							<Button
								onClick={handleExport}
								variant="outline"
								className="gap-2"
							>
								<DownloadIcon className="size-4" />
								Export Account Key Bundle
							</Button>
							<div className="flex items-start gap-2 text-muted-foreground text-xs">
								<TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" />
								This file contains your encrypted private key. Anyone who has
								this file and your password can access your account — store it
								somewhere safe, never share it.
							</div>
						</div>
					) : (
						<div className="space-y-2">
							<p className="text-muted-foreground text-sm">
								No cryptographic identity has been provisioned for this account
								yet.
							</p>
							<p className="text-muted-foreground text-xs">
								Key generation, Argon2id derivation, and key wrapping happen
								entirely on your device — this account was created before that
								pipeline was wired up.
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<div className="mb-2 flex size-9 items-center justify-center rounded-full bg-muted">
						<LaptopIcon className="size-4" />
					</div>
					<CardTitle>Devices</CardTitle>
					<CardDescription>
						Sessions with access to your account.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{session.data?.session ? (
						<div className="flex items-center justify-between border border-border p-3">
							<div className="min-w-0">
								<p className="truncate font-medium text-sm">This device</p>
								<p className="truncate text-muted-foreground text-xs">
									{session.data.session.userAgent ?? "Unknown device"}
								</p>
							</div>
							<span className="shrink-0 rounded-full bg-muted px-2 py-1 text-muted-foreground text-xs">
								Active
							</span>
						</div>
					) : null}
					<p className="mt-3 text-muted-foreground text-xs">
						Cross-device session management is coming soon — for now this only
						shows the device you're currently signed in on.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
