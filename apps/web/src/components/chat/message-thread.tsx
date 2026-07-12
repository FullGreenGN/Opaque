import { Bubble, BubbleContent } from "@opaque/ui/components/bubble";
import {
	Empty,
	EmptyDescription,
	EmptyMedia,
	EmptyTitle,
} from "@opaque/ui/components/empty";
import { Message, MessageContent } from "@opaque/ui/components/message";
import {
	MessageScroller,
	MessageScrollerButton,
	MessageScrollerContent,
	MessageScrollerItem,
	MessageScrollerProvider,
	MessageScrollerViewport,
} from "@opaque/ui/components/message-scroller";
import { Skeleton } from "@opaque/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { LockIcon, MessageSquareLockIcon } from "lucide-react";

import { formatRelativeTime } from "@/lib/format-relative-time";
import { trpc } from "@/utils/trpc";

export function MessageThread({
	conversationId,
	currentUserId,
}: {
	conversationId: string;
	currentUserId: string;
}) {
	const messages = useQuery(
		trpc.chat.getMessages.queryOptions({ conversationId }),
	);

	if (messages.isLoading) {
		return (
			<div className="flex min-h-0 flex-1 flex-col justify-end gap-3 p-4">
				<Skeleton className="h-10 w-2/3 self-start" />
				<Skeleton className="h-10 w-1/2 self-end" />
				<Skeleton className="h-10 w-3/5 self-start" />
			</div>
		);
	}

	if (messages.data?.messages.length === 0) {
		return (
			<Empty className="flex-1">
				<EmptyMedia variant="icon">
					<MessageSquareLockIcon />
				</EmptyMedia>
				<EmptyTitle>No messages yet</EmptyTitle>
				<EmptyDescription>
					Say hello — every message here is sealed client-side before it ever
					leaves your device.
				</EmptyDescription>
			</Empty>
		);
	}

	return (
		<MessageScrollerProvider>
			<MessageScroller className="flex-1">
				<MessageScrollerViewport>
					<MessageScrollerContent className="p-4">
						{messages.data?.messages.map((message) => {
							const align =
								message.senderId === currentUserId ? "end" : "start";

							return (
								<MessageScrollerItem key={message.id}>
									<Message align={align}>
										<MessageContent>
											<Bubble
												align={align}
												variant={align === "end" ? "default" : "secondary"}
											>
												<BubbleContent className="flex items-center gap-1.5">
													<LockIcon className="size-3 shrink-0" />
													Encrypted message
												</BubbleContent>
											</Bubble>
											<span className="px-2.5 text-muted-foreground text-xs">
												{formatRelativeTime(new Date(message.createdAt))}
											</span>
										</MessageContent>
									</Message>
								</MessageScrollerItem>
							);
						})}
					</MessageScrollerContent>
				</MessageScrollerViewport>
				<MessageScrollerButton />
			</MessageScroller>
		</MessageScrollerProvider>
	);
}
