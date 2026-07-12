import "@/unistyles";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useUnistyles } from "react-native-unistyles";

import { queryClient } from "@/utils/trpc";

export const unstable_settings = {
	initialRouteName: "login",
};

export default function RootLayout() {
	const { theme } = useUnistyles();

	return (
		<QueryClientProvider client={queryClient}>
			<GestureHandlerRootView style={{ flex: 1 }}>
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
				>
					<Stack.Screen name="login" options={{ headerShown: false }} />
					<Stack.Screen name="(auth)" options={{ headerShown: false }} />
				</Stack>
			</GestureHandlerRootView>
		</QueryClientProvider>
	);
}
