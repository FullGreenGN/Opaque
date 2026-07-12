import "@/unistyles";
import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { authClient } from "@/lib/auth-client";

export default function AuthLayout() {
	const { theme } = useUnistyles();
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return (
			<View style={styles.loading}>
				<ActivityIndicator color={theme.colors.typography} />
			</View>
		);
	}

	if (!session) {
		return <Redirect href="/login" />;
	}

	return (
		<Stack
			screenOptions={{
				headerStyle: {
					backgroundColor: theme.colors.background,
				},
				headerTitleStyle: {
					color: theme.colors.foreground,
				},
				headerTintColor: theme.colors.foreground,
			}}
		/>
	);
}

const styles = StyleSheet.create((theme) => ({
	loading: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: theme.colors.background,
	},
}));
