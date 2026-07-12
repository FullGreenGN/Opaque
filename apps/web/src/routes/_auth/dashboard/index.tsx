import {
	Empty,
	EmptyDescription,
	EmptyMedia,
	EmptyTitle,
} from "@opaque/ui/components/empty";
import { createFileRoute } from "@tanstack/react-router";
import { LockKeyholeIcon } from "lucide-react";

export const Route = createFileRoute("/_auth/dashboard/")({
	component: DashboardIndex,
});

function DashboardIndex() {
	return (
		<Empty className="flex-1">
			<EmptyMedia variant="icon">
				<LockKeyholeIcon />
			</EmptyMedia>
			<EmptyTitle>Select a conversation</EmptyTitle>
			<EmptyDescription>
				Pick a conversation from the sidebar, or start a new one, to view its
				messages.
			</EmptyDescription>
		</Empty>
	);
}
