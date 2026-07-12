import { APP_NAME, APP_TAGLINE } from "@opaque/config/app";
import { createFileRoute } from "@tanstack/react-router";
import { LockKeyhole } from "lucide-react";
import { useState } from "react";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

export const Route = createFileRoute("/login")({
	component: RouteComponent,
});

function RouteComponent() {
	const [showSignIn, setShowSignIn] = useState(true);

	return (
		<div className="flex min-h-full flex-col items-center justify-center gap-8 px-4 py-12">
			<div className="flex flex-col items-center gap-2 text-center">
				<div className="flex size-10 items-center justify-center rounded-full bg-muted">
					<LockKeyhole className="size-5 text-foreground" />
				</div>
				<h1 className="font-mono font-semibold text-xl tracking-tight">
					{APP_NAME}
				</h1>
				<p className="max-w-xs text-muted-foreground text-xs">{APP_TAGLINE}</p>
			</div>

			<div className="w-full max-w-sm rounded-none border border-border bg-card">
				{showSignIn ? (
					<SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
				) : (
					<SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
				)}
			</div>
		</div>
	);
}
