import { Button } from "@opaque/ui/components/button";
import { Skeleton } from "@opaque/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useMatch } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { ConversationListItem } from "@/components/chat/conversation-list-item";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

export function ConversationSidebar() {
	const { data: session } = authClient.useSession();
	const conversations = useQuery(trpc.chat.getConversations.queryOptions());
	const activeMatch = useMatch({
		from: "/_auth/dashboard/$conversationId",
		shouldThrow: false,
	});

	return (
		<aside className="flex h-full min-h-0 w-80 shrink-0 flex-col border-border border-r">
			<div className="flex items-center justify-between border-border border-b px-3 py-3">
				<h2 className="font-semibold text-sm">Conversations</h2>
				<Button
					variant="ghost"
					size="icon-sm"
					// New-conversation creation isn't wired up yet — it needs a
					// tRPC mutation plus a recipient key exchange step.
					onClick={() =>
						toast.info("Starting new conversations is coming soon")
					}
				>
					<PlusIcon />
					<span className="sr-only">New conversation</span>
				</Button>
			</div>

			<div className="min-h-0 flex-1 overflow-y-auto">
				{conversations.isLoading &&
					["a", "b", "c", "d"].map((key) => (
						<div key={key} className="flex items-center gap-3 px-3 py-3">
							<Skeleton className="size-9 shrink-0 rounded-full" />
							<div className="flex-1 space-y-2">
								<Skeleton className="h-3 w-2/3" />
								<Skeleton className="h-3 w-1/3" />
							</div>
						</div>
					))}

				{conversations.data?.length === 0 && (
					<p className="px-3 py-6 text-center text-muted-foreground text-xs">
						No conversations yet.
					</p>
				)}

				{session?.user &&
					conversations.data?.map((conversation) => (
						<ConversationListItem
							key={conversation.id}
							conversation={conversation}
							currentUserId={session.user.id}
							isActive={activeMatch?.params.conversationId === conversation.id}
						/>
					))}
			</div>
		</aside>
	);
}
