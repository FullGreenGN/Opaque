import { useForm } from "@tanstack/react-form";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
	ActivityIndicator,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";
import z from "zod";

import { authClient } from "@/lib/auth-client";
import { setIdentityPrivateKey } from "@/lib/session-keys";
import { deriveMasterKey, unwrapPrivateKey, wipe } from "@/lib/zero-knowledge";
import { queryClient, trpcClient } from "@/utils/trpc";

const signInSchema = z.object({
	email: z
		.string()
		.trim()
		.min(1, "Email is required")
		.email("Enter a valid email address"),
	password: z
		.string()
		.min(1, "Password is required")
		.min(8, "Use at least 8 characters"),
});

function getErrorMessage(error: unknown): string | null {
	if (!error) return null;

	if (typeof error === "string") {
		return error;
	}

	if (Array.isArray(error)) {
		for (const issue of error) {
			const message = getErrorMessage(issue);
			if (message) {
				return message;
			}
		}
		return null;
	}

	if (typeof error === "object" && error !== null) {
		const maybeError = error as { message?: unknown };
		if (typeof maybeError.message === "string") {
			return maybeError.message;
		}
	}

	return null;
}

export function SignIn() {
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		validators: {
			onSubmit: signInSchema,
		},
		onSubmit: async ({ value, formApi }) => {
			// Zero-knowledge login: fetch the account's keystore first so the
			// client can re-derive its Argon2id master key locally. The server
			// only ever returns ciphertext + KDF params here — never a private
			// key or password. The response is uniform (real keystore or a
			// deterministic decoy) whether or not the account/keystore exists,
			// so any thrown error here is a genuine service failure, not a
			// "no account" signal — don't branch on error shape.
			let keystore: Awaited<
				ReturnType<typeof trpcClient.auth.getKeystore.query>
			>;
			try {
				keystore = await trpcClient.auth.getKeystore.query({
					email: value.email.trim(),
				});
			} catch {
				setError("Could not reach the keystore service");
				return;
			}

			// Deriving the master key and unwrapping the private key is
			// best-effort and must never block sign-in: a decoy keystore, a
			// wrong password against a real one, or any local crypto hiccup
			// will fail here, and that's expected — Better Auth below is the
			// actual authentication gate, not this. We just won't have a local
			// identity key for the session in that case.
			try {
				const masterKey = await deriveMasterKey(
					value.password,
					keystore.keyDerivationSalt,
					keystore.keyDerivationParams,
				);
				try {
					const privateKey = await unwrapPrivateKey(
						{
							encryptedPrivateKey: keystore.encryptedPrivateKey,
							encryptionNonce: keystore.encryptionNonce,
						},
						masterKey,
					);
					setIdentityPrivateKey(privateKey);
				} finally {
					await wipe(masterKey);
				}
			} catch {
				// No usable identity key for this session — fine, see above.
			}

			await authClient.signIn.email(
				{
					email: value.email.trim(),
					password: value.password,
				},
				{
					onError(error) {
						setError(error.error?.message || "Failed to sign in");
					},
					onSuccess() {
						setError(null);
						formApi.reset();
						queryClient.refetchQueries();
						router.replace("/dashboard");
					},
				},
			);
		},
	});

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Sign In</Text>

			<form.Subscribe
				selector={(state) => ({
					isSubmitting: state.isSubmitting,
					validationError: getErrorMessage(state.errorMap.onSubmit),
				})}
			>
				{({ isSubmitting, validationError }) => {
					const formError = error ?? validationError;

					return (
						<>
							{formError ? (
								<View style={styles.errorContainer}>
									<Text style={styles.errorText}>{formError}</Text>
								</View>
							) : null}

							<form.Field name="email">
								{(field) => (
									<TextInput
										style={styles.input}
										placeholder="Email"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChangeText={(value) => {
											field.handleChange(value);
											if (error) {
												setError(null);
											}
										}}
										keyboardType="email-address"
										autoCapitalize="none"
									/>
								)}
							</form.Field>

							<form.Field name="password">
								{(field) => (
									<TextInput
										style={styles.input}
										placeholder="Password"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChangeText={(value) => {
											field.handleChange(value);
											if (error) {
												setError(null);
											}
										}}
										secureTextEntry
										onSubmitEditing={form.handleSubmit}
									/>
								)}
							</form.Field>

							<TouchableOpacity
								onPress={form.handleSubmit}
								disabled={isSubmitting}
								style={styles.button}
							>
								{isSubmitting ? (
									<ActivityIndicator size="small" color="#fff" />
								) : (
									<Text style={styles.buttonText}>Sign In</Text>
								)}
							</TouchableOpacity>
						</>
					);
				}}
			</form.Subscribe>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	container: {
		marginTop: 24,
		padding: 16,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	title: {
		fontSize: 18,
		fontWeight: "600",
		color: theme.colors.typography,
		marginBottom: 16,
	},
	errorContainer: {
		marginBottom: 16,
		padding: 12,
		borderRadius: 6,
	},
	errorText: {
		color: theme.colors.destructive,
		fontSize: 14,
	},
	input: {
		marginBottom: 12,
		padding: 16,
		borderRadius: 6,
		color: theme.colors.typography,
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	button: {
		backgroundColor: theme.colors.primary,
		padding: 16,
		borderRadius: 6,
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
	},
	buttonText: {
		fontWeight: "500",
	},
}));
