import "@/unistyles";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import {
	FlatList,
	KeyboardAvoidingView,
	Platform,
	Text,
	View,
} from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { MessageComposer } from "@/components/chat/message-composer";
import { Container } from "@/components/container";
import { authClient } from "@/lib/auth-client";
import { getConversationTitle } from "@/lib/conversation-title";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { trpc } from "@/utils/trpc";

export default function ConversationScreen() {
	const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
	const { theme } = useUnistyles();
	const { data: session } = authClient.useSession();
	const currentUserId = session?.user.id ?? "";

	const conversations = useQuery(trpc.chat.getConversations.queryOptions());
	const messages = useQuery(
		trpc.chat.getMessages.queryOptions({ conversationId }),
	);

	const conversation = conversations.data?.find((c) => c.id === conversationId);
	const title = conversation
		? getConversationTitle(conversation, currentUserId)
		: "Conversation";
	const reversedMessages = [...(messages.data?.messages ?? [])].reverse();

	return (
		<Container>
			<Stack.Screen options={{ title }} />

			<KeyboardAvoidingView
				style={styles.flex}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
			>
				<FlatList
					inverted
					data={reversedMessages}
					keyExtractor={(item) => item.id}
					contentContainerStyle={styles.listContent}
					ListEmptyComponent={
						!messages.isLoading ? (
							<View style={styles.emptyState}>
								<Ionicons
									name="lock-closed-outline"
									size={24}
									color={theme.colors.mutedForeground}
								/>
								<Text style={styles.emptyText}>
									No messages yet. Every message here is sealed client-side
									before it leaves your device.
								</Text>
							</View>
						) : null
					}
					renderItem={({ item }) => {
						const isMine = item.senderId === currentUserId;
						return (
							<View style={[styles.bubbleRow, isMine && styles.bubbleRowMine]}>
								<View
									style={[
										styles.bubble,
										isMine ? styles.bubbleMine : styles.bubbleTheirs,
									]}
								>
									<Ionicons
										name="lock-closed"
										size={11}
										color={
											isMine
												? theme.colors.primaryForeground
												: theme.colors.typography
										}
									/>
									<Text
										style={[styles.bubbleText, isMine && styles.bubbleTextMine]}
									>
										Encrypted message
									</Text>
								</View>
								<Text style={styles.timestamp}>
									{formatRelativeTime(new Date(item.createdAt))}
								</Text>
							</View>
						);
					}}
				/>

				<MessageComposer conversationId={conversationId} />
			</KeyboardAvoidingView>
		</Container>
	);
}

const styles = StyleSheet.create((theme) => ({
	flex: {
		flex: 1,
	},
	listContent: {
		padding: theme.spacing.md,
		gap: theme.spacing.sm + 4,
	},
	emptyState: {
		alignItems: "center",
		gap: theme.spacing.sm,
		padding: theme.spacing.xl,
		transform: [{ scaleY: -1 }],
	},
	emptyText: {
		textAlign: "center",
		fontSize: theme.fontSize.sm,
		color: theme.colors.mutedForeground,
		maxWidth: 260,
	},
	bubbleRow: {
		alignItems: "flex-start",
		gap: 4,
	},
	bubbleRowMine: {
		alignItems: "flex-end",
	},
	bubble: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		maxWidth: "80%",
		paddingHorizontal: theme.spacing.sm + 4,
		paddingVertical: theme.spacing.sm,
		borderRadius: theme.borderRadius.md,
	},
	bubbleMine: {
		backgroundColor: theme.colors.primary,
	},
	bubbleTheirs: {
		backgroundColor: theme.colors.secondary,
	},
	bubbleText: {
		fontSize: theme.fontSize.xs,
		color: theme.colors.typography,
	},
	bubbleTextMine: {
		color: theme.colors.primaryForeground,
	},
	timestamp: {
		fontSize: theme.fontSize.xs,
		color: theme.colors.mutedForeground,
		paddingHorizontal: 4,
	},
}));
