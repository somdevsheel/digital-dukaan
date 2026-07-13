import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Screen, Text, Input, Button } from "@platform/ui-native";
import { useAuth } from "../../lib/auth-context";
import { ApiError } from "../../lib/api";
import type { AuthStackScreenProps } from "../../navigation/types";

export function LoginScreen({ navigation }: AuthStackScreenProps<"Login">) {
  const { requestOtp } = useAuth();
  const [phone, setPhone] = useState("+91");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await requestOtp(phone.trim());
      navigation.navigate("VerifyOtp", { phone: phone.trim() });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen style={styles.screen}>
      <View style={styles.content}>
        <Text variant="title">Welcome</Text>
        <Text variant="body" color="muted" style={styles.subtitle}>
          Enter your phone number to sign in or create an account.
        </Text>
        <Input
          label="Phone number"
          keyboardType="phone-pad"
          autoComplete="tel"
          value={phone}
          onChangeText={setPhone}
          placeholder="+919812345678"
        />
        {error && (
          <Text variant="caption" color="destructive">
            {error}
          </Text>
        )}
        <Button
          label={loading ? "Sending…" : "Continue"}
          onPress={() => void onSubmit()}
          loading={loading}
          disabled={phone.trim().length < 10}
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
