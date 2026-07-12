import { APP_NAME, APP_TAGLINE } from "@opaque/config/app";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	const healthCheck = useQuery(trpc.healthCheck.queryOptions());

	return (
		<div className="container mx-auto max-w-3xl px-4 py-2">
			<div className="py-6">
				<h1 className="font-mono font-semibold text-2xl tracking-tight">
					{APP_NAME}
				</h1>
				<p className="text-muted-foreground text-sm">{APP_TAGLINE}</p>
			</div>
			<div className="grid gap-6">
				<section className="rounded-lg border p-4">
					<h2 className="mb-2 font-medium">API Status</h2>
					<div className="flex items-center gap-2">
						<div
							className={`h-2 w-2 rounded-full ${healthCheck.data ? "bg-green-500" : "bg-red-500"}`}
						/>
						<span className="text-muted-foreground text-sm">
							{healthCheck.isLoading
								? "Checking..."
								: healthCheck.data
									? "Connected"
									: "Disconnected"}
						</span>
					</div>
				</section>
			</div>
		</div>
	);
}
