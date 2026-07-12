import { useQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { LockIcon } from "lucide-react";

import { MessageComposer } from "@/components/chat/message-composer";
import { MessageThread } from "@/components/chat/message-thread";
import { getConversationTitle } from "@/lib/conversation-title";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/$conversationId")({
	component: ConversationView,
	loader: async ({ context, params }) => {
		try {
			await context.queryClient.ensureQueryData(
				context.trpc.chat.getMessages.queryOptions({
					conversationId: params.conversationId,
				}),
			);
		} catch {
			throw notFound();
		}
	},
});

function ConversationView() {
	const { conversationId } = Route.useParams();
	const { session } = Route.useRouteContext();
	const conversations = useQuery(trpc.chat.getConversations.queryOptions());

	const conversation = conversations.data?.find((c) => c.id === conversationId);
	const currentUserId = session.data?.user.id ?? "";

	return (
		<>
			<div className="flex items-center gap-2 border-border border-b px-4 py-3">
				<h2 className="font-semibold text-sm">
					{conversation
						? getConversationTitle(conversation, currentUserId)
						: "Conversation"}
				</h2>
				<span className="flex items-center gap-1 text-muted-foreground text-xs">
					<LockIcon className="size-3" />
					End-to-end encrypted
				</span>
			</div>

			<MessageThread
				conversationId={conversationId}
				currentUserId={currentUserId}
			/>
			<MessageComposer conversationId={conversationId} />
		</>
	);
}
