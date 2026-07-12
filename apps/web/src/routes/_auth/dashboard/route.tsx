import { createFileRoute, Outlet } from "@tanstack/react-router";

import { ConversationSidebar } from "@/components/chat/conversation-sidebar";

export const Route = createFileRoute("/_auth/dashboard")({
	component: DashboardLayout,
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(
			context.trpc.chat.getConversations.queryOptions(),
		);
	},
});

function DashboardLayout() {
	return (
		<div className="flex h-full min-h-0">
			<ConversationSidebar />
			<div className="flex min-h-0 flex-1 flex-col">
				<Outlet />
			</div>
		</div>
	);
}
