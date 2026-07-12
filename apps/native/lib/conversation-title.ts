import type { AppRouter } from "@opaque/api/routers/index";
import type { inferRouterOutputs } from "@trpc/server";

type Conversation =
	inferRouterOutputs<AppRouter>["chat"]["getConversations"][number];

export function getConversationTitle(
	conversation: Conversation,
	currentUserId: string,
): string {
	if (conversation.type === "GROUP") {
		return `Encrypted group · ${conversation.participants.length} members`;
	}

	const otherParticipant =
		conversation.participants.find((p) => p.id !== currentUserId) ??
		conversation.participants[0];

	return otherParticipant?.name ?? "Unknown";
}
