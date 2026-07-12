import "@/unistyles";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, TextInput, TouchableOpacity, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

export function MessageComposer({
	conversationId,
}: {
	conversationId: string;
}) {
	const [draft, setDraft] = useState("");
	const { theme } = useUnistyles();

	const handleSend = () => {
		const trimmed = draft.trim();
		if (!trimmed) {
			return;
		}

		// Sending isn't wired to the server yet: the draft still needs to be
		// sealed client-side (encryptMessage in @/lib/zero-knowledge) with the
		// conversation's session key before a future chat.sendMessage mutation
		// can carry it — sending raw plaintext through tRPC would defeat the
		// zero-knowledge design, so we stop here for now.
		Alert.alert(
			"Not wired up yet",
			"Messages are encrypted client-side before sending — coming soon",
		);
		setDraft("");
	};

	return (
		<View style={styles.container}>
			<TextInput
				style={styles.input}
				placeholder="Write an encrypted message…"
				placeholderTextColor={theme.colors.mutedForeground}
				value={draft}
				onChangeText={setDraft}
				multiline
				accessibilityLabel={`Message for conversation ${conversationId}`}
			/>
			<TouchableOpacity
				onPress={handleSend}
				disabled={!draft.trim()}
				style={[styles.sendButton, !draft.trim() && styles.sendButtonDisabled]}
			>
				<Ionicons
					name="send"
					size={16}
					color={theme.colors.primaryForeground}
				/>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	container: {
		flexDirection: "row",
		alignItems: "flex-end",
		gap: theme.spacing.sm,
		borderTopWidth: 1,
		borderTopColor: theme.colors.border,
		padding: theme.spacing.sm + 4,
	},
	input: {
		flex: 1,
		maxHeight: 120,
		paddingHorizontal: theme.spacing.sm + 4,
		paddingVertical: theme.spacing.sm,
		borderRadius: theme.borderRadius.md,
		borderWidth: 1,
		borderColor: theme.colors.border,
		color: theme.colors.typography,
		fontSize: theme.fontSize.sm,
	},
	sendButton: {
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: theme.colors.primary,
	},
	sendButtonDisabled: {
		opacity: 0.5,
	},
}));
