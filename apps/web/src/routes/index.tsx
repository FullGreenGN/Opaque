import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE } from "@opaque/config/app";
import { Button } from "@opaque/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@opaque/ui/components/card";
import { Marker, MarkerContent } from "@opaque/ui/components/marker";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
	EyeOffIcon,
	KeyRoundIcon,
	LockKeyholeIcon,
	RadarIcon,
	ShieldOffIcon,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { isDesktopApp } from "@/lib/platform";

export const Route = createFileRoute("/")({
	// The desktop shell has no use for a marketing page — it should always
	// land the user directly in either the login view or their conversations.
	beforeLoad: async () => {
		if (!isDesktopApp()) {
			return;
		}
		const session = await authClient.getSession();
		throw redirect({ to: session.data ? "/dashboard" : "/login" });
	},
	component: HomeComponent,
});

const TENETS = [
	{
		icon: KeyRoundIcon,
		title: "Zero-knowledge by design",
		description:
			"Your keys are generated and derived on your device. We never receive your password or your private key — only ciphertext ever reaches our servers.",
	},
	{
		icon: EyeOffIcon,
		title: "Zero server visibility",
		description:
			"Messages are sealed client-side before they leave your device. The server relays encrypted blobs it has no ability to read, index, or search.",
	},
	{
		icon: ShieldOffIcon,
		title: "No client-side surveillance",
		description:
			"No analytics SDKs, no behavioral tracking, no ad networks. What you do in the app stays on your device — that's the whole point.",
	},
] as const;

const PIPELINE = [
	"Generate an identity keypair locally",
	"Derive a master key from your password with Argon2id",
	"Seal every message with XChaCha20-Poly1305 before it's sent",
] as const;

function HomeComponent() {
	return (
		<div className="mx-auto max-w-3xl px-4 py-16">
			<section className="flex flex-col items-center gap-6 text-center">
				<div className="flex size-12 items-center justify-center rounded-full bg-muted">
					<LockKeyholeIcon className="size-6" />
				</div>
				<div className="space-y-2">
					<h1 className="font-mono font-semibold text-4xl tracking-tight">
						{APP_NAME}
					</h1>
					<p className="text-muted-foreground">{APP_TAGLINE}</p>
				</div>
				<p className="max-w-xl text-muted-foreground text-sm">
					{APP_DESCRIPTION}
				</p>
				<div className="flex gap-3">
					<Link to="/login">
						<Button size="lg">Get started</Button>
					</Link>
					<Link to="/login">
						<Button size="lg" variant="outline">
							Sign in
						</Button>
					</Link>
				</div>
			</section>

			<Marker variant="separator" className="my-12">
				<MarkerContent>Why {APP_NAME}</MarkerContent>
			</Marker>

			<section className="grid gap-4 sm:grid-cols-3">
				{TENETS.map(({ icon: Icon, title, description }) => (
					<Card key={title}>
						<CardHeader>
							<div className="mb-2 flex size-9 items-center justify-center rounded-full bg-muted">
								<Icon className="size-4" />
							</div>
							<CardTitle>{title}</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground text-sm">{description}</p>
						</CardContent>
					</Card>
				))}
			</section>

			<Marker variant="separator" className="my-12">
				<MarkerContent>How it works</MarkerContent>
			</Marker>

			<section className="space-y-4">
				{PIPELINE.map((step, index) => (
					<div
						key={step}
						className="flex items-center gap-4 border border-border p-4"
					>
						<span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-xs">
							{index + 1}
						</span>
						<p className="text-sm">{step}</p>
					</div>
				))}
				<div className="flex items-center gap-2 pt-2 text-muted-foreground text-xs">
					<RadarIcon className="size-3.5" />
					No plaintext, no keys, no metadata we don't strictly need to route
					your messages.
				</div>
			</section>
		</div>
	);
}
