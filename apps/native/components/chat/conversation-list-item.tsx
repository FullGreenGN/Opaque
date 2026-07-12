import "@/unistyles";
import { Ionicons } from "@expo/vector-icons";
import type { AppRouter } from "@opaque/api/routers/index";
import type { inferRouterOutputs } from "@trpc/server";
import { Link } from "expo-router";
import { Image, Pressable, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { getConversationTitle } from "@/lib/conversation-title";
import { formatRelativeTime } from "@/lib/format-relative-time";

type Conversation =
	inferRouterOutputs<AppRouter>["chat"]["getConversations"][number];

export function ConversationListItem({
	conversation,
	currentUserId,
}: {
	conversation: Conversation;
	currentUserId: string;
}) {
	const { theme } = useUnistyles();
	const isGroup = conversation.type === "GROUP";
	const otherParticipant =
		conversation.participants.find((p) => p.id !== currentUserId) ??
		conversation.participants[0];
	const title = getConversationTitle(conversation, currentUserId);

	return (
		<Link
			href={{
				pathname: "/dashboard/[conversationId]",
				params: { conversationId: conversation.id },
			}}
			asChild
		>
			<Pressable style={styles.row}>
				{isGroup ? (
					<View style={styles.avatarFallback}>
						<Ionicons
							name="people"
							size={18}
							color={theme.colors.mutedForeground}
						/>
					</View>
				) : otherParticipant?.image ? (
					<Image
						source={{ uri: otherParticipant.image }}
						style={styles.avatarImage}
					/>
				) : (
					<View style={styles.avatarFallback}>
						<Text style={styles.avatarInitial}>
							{title.charAt(0).toUpperCase()}
						</Text>
					</View>
				)}

				<View style={styles.content}>
					<Text style={styles.title} numberOfLines={1}>
						{title}
					</Text>
					<View style={styles.subtitleRow}>
						{conversation.lastMessage ? (
							<>
								<Ionicons
									name="lock-closed"
									size={11}
									color={theme.colors.mutedForeground}
								/>
								<Text style={styles.subtitle}>Encrypted message</Text>
							</>
						) : (
							<Text style={styles.subtitle}>No messages yet</Text>
						)}
					</View>
				</View>

				{conversation.lastMessage && (
					<Text style={styles.timestamp}>
						{formatRelativeTime(new Date(conversation.lastMessage.createdAt))}
					</Text>
				)}
			</Pressable>
		</Link>
	);
}

const styles = StyleSheet.create((theme) => ({
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.spacing.sm + 4,
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.sm + 4,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
	},
	avatarImage: {
		width: 36,
		height: 36,
		borderRadius: 18,
	},
	avatarFallback: {
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: theme.colors.muted,
	},
	avatarInitial: {
		fontSize: theme.fontSize.sm,
		fontWeight: "500",
		color: theme.colors.mutedForeground,
	},
	content: {
		flex: 1,
		minWidth: 0,
		gap: 2,
	},
	title: {
		fontSize: theme.fontSize.sm,
		fontWeight: "500",
		color: theme.colors.typography,
	},
	subtitleRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	subtitle: {
		fontSize: theme.fontSize.xs,
		color: theme.colors.mutedForeground,
	},
	timestamp: {
		fontSize: theme.fontSize.xs,
		color: theme.colors.mutedForeground,
	},
}));
