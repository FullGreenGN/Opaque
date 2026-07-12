import "@/unistyles";
import { Ionicons } from "@expo/vector-icons";
import { APP_NAME, APP_TAGLINE } from "@opaque/config/app";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { Container } from "@/components/container";
import { SignIn } from "@/components/sign-in";
import { SignUp } from "@/components/sign-up";

export default function LoginScreen() {
	const [showSignIn, setShowSignIn] = useState(true);
	const { theme } = useUnistyles();

	return (
		<Container>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				keyboardShouldPersistTaps="handled"
			>
				<View style={styles.header}>
					<View style={styles.iconCircle}>
						<Ionicons
							name="lock-closed"
							size={20}
							color={theme.colors.typography}
						/>
					</View>
					<Text style={styles.wordmark}>{APP_NAME}</Text>
					<Text style={styles.tagline}>{APP_TAGLINE}</Text>
				</View>

				{showSignIn ? <SignIn /> : <SignUp />}

				<TouchableOpacity onPress={() => setShowSignIn((prev) => !prev)}>
					<Text style={styles.switchLink}>
						{showSignIn
							? "Need an account? Sign Up"
							: "Already have an account? Sign In"}
					</Text>
				</TouchableOpacity>
			</ScrollView>
		</Container>
	);
}

const styles = StyleSheet.create((theme) => ({
	scrollContent: {
		flexGrow: 1,
		justifyContent: "center",
		padding: theme.spacing.lg,
	},
	header: {
		alignItems: "center",
		marginBottom: theme.spacing.md,
	},
	iconCircle: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: theme.colors.muted,
		marginBottom: theme.spacing.sm,
	},
	wordmark: {
		fontSize: theme.fontSize.xl,
		fontWeight: "600",
		color: theme.colors.typography,
	},
	tagline: {
		marginTop: theme.spacing.xs,
		maxWidth: 280,
		textAlign: "center",
		fontSize: theme.fontSize.xs,
		color: theme.colors.mutedForeground,
	},
	switchLink: {
		marginTop: theme.spacing.lg,
		textAlign: "center",
		fontSize: theme.fontSize.sm,
		color: theme.colors.primary,
	},
}));
