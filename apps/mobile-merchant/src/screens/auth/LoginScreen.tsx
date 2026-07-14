import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Screen, Text, Input, Button } from "@platform/ui-native";
import { useAuth } from "../../lib/auth-context";
import { ApiError } from "../../lib/api";

export function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen style={styles.screen}>
      <View style={styles.content}>
        <Text variant="title">Merchant sign in</Text>
        <Text variant="body" color="muted" style={styles.subtitle}>
          Manage your storefront, catalog, and orders.
        </Text>
        <Input
          label="Email"
          keyboardType="email-address"
          autoComplete="email"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
        />
        <Input
          label="Password"
          secureTextEntry
          autoComplete="current-password"
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={() => void onSubmit()}
        />
        {error && (
          <Text variant="caption" color="destructive">
            {error}
          </Text>
        )}
        <Button
          label={loading ? "Signing in…" : "Sign in"}
          onPress={() => void onSubmit()}
          loading={loading}
          disabled={!email.trim() || !password}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: "center" },
  content: { paddingHorizontal: 24, gap: 16 },
  subtitle: { marginBottom: 8 },
});
