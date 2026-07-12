import type { AppRouter } from "@opaque/api/routers/index";
import { cn } from "@opaque/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import type { inferRouterOutputs } from "@trpc/server";
import { LockIcon, UsersIcon } from "lucide-react";

import { getConversationTitle } from "@/lib/conversation-title";
import { formatRelativeTime } from "@/lib/format-relative-time";

type Conversation =
	inferRouterOutputs<AppRouter>["chat"]["getConversations"][number];

function ParticipantAvatar({
	name,
	image,
}: {
	name: string;
	image: string | null;
}) {
	if (image) {
		return (
			<img
				src={image}
				alt=""
				className="size-9 shrink-0 rounded-full object-cover"
			/>
		);
	}

	return (
		<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted font-medium text-muted-foreground text-xs">
			{name.charAt(0).toUpperCase()}
		</div>
	);
}

export function ConversationListItem({
	conversation,
	currentUserId,
	isActive,
}: {
	conversation: Conversation;
	currentUserId: string;
	isActive: boolean;
}) {
	const isGroup = conversation.type === "GROUP";
	const otherParticipant =
		conversation.participants.find((p) => p.id !== currentUserId) ??
		conversation.participants[0];

	const title = getConversationTitle(conversation, currentUserId);

	return (
		<Link
			to="/dashboard/$conversationId"
			params={{ conversationId: conversation.id }}
			className={cn(
				"flex w-full items-center gap-3 border-border border-b px-3 py-3 text-left transition-colors hover:bg-muted",
				isActive && "bg-muted",
			)}
		>
			{isGroup ? (
				<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
					<UsersIcon className="size-4" />
				</div>
			) : (
				<ParticipantAvatar
					name={title}
					image={otherParticipant?.image ?? null}
				/>
			)}

			<div className="flex min-w-0 flex-1 flex-col gap-0.5">
				<span className="truncate font-medium text-sm">{title}</span>
				<span className="flex items-center gap-1 text-muted-foreground text-xs">
					{conversation.lastMessage ? (
						<>
							<LockIcon className="size-3" />
							Encrypted message
						</>
					) : (
						"No messages yet"
					)}
				</span>
			</div>

			{conversation.lastMessage && (
				<span className="shrink-0 text-muted-foreground text-xs">
					{formatRelativeTime(new Date(conversation.lastMessage.createdAt))}
				</span>
			)}
		</Link>
	);
}
