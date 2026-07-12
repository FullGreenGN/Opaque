import "@/unistyles";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { ConversationListItem } from "@/components/chat/conversation-list-item";
import { Container } from "@/components/container";
import { authClient } from "@/lib/auth-client";
import { clearIdentityPrivateKey } from "@/lib/session-keys";
import { trpc } from "@/utils/trpc";

export default function DashboardScreen() {
	const { theme } = useUnistyles();
	const router = useRouter();
	const { data: session } = authClient.useSession();
	const conversations = useQuery(trpc.chat.getConversations.queryOptions());

	return (
		<Container>
			<Stack.Screen
				options={{
					title: "Conversations",
					headerRight: () => (
						<TouchableOpacity
							onPress={() => {
								authClient.signOut({
									fetchOptions: {
										onSuccess: () => {
											clearIdentityPrivateKey();
											router.replace("/login");
										},
									},
								});
							}}
						>
							<Ionicons
								name="log-out-outline"
								size={22}
								color={theme.colors.typography}
							/>
						</TouchableOpacity>
					),
				}}
			/>

			<FlatList
				data={conversations.data ?? []}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) =>
					session?.user ? (
						<ConversationListItem
							conversation={item}
							currentUserId={session.user.id}
						/>
					) : null
				}
				ListEmptyComponent={
					!conversations.isLoading ? (
						<View style={styles.emptyState}>
							<Text style={styles.emptyText}>No conversations yet.</Text>
						</View>
					) : null
				}
			/>
		</Container>
	);
}

const styles = StyleSheet.create((theme) => ({
	emptyState: {
		padding: theme.spacing.xl,
		alignItems: "center",
	},
	emptyText: {
		fontSize: theme.fontSize.sm,
		color: theme.colors.mutedForeground,
	},
}));
