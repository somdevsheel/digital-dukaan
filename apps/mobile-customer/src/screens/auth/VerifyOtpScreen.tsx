import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Screen, Text, Input, Button } from "@platform/ui-native";
import { useAuth } from "../../lib/auth-context";
import { ApiError } from "../../lib/api";
import type { AuthStackScreenProps } from "../../navigation/types";

export function VerifyOtpScreen({ route }: AuthStackScreenProps<"VerifyOtp">) {
  const { phone } = route.params;
  const { verifyOtp, requestOtp } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      // No further navigation needed on success — AuthProvider flips `status` to
      // "authenticated" and RootNavigator swaps the whole stack to MainTabs.
      await verifyOtp(phone, code.trim());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    setResending(true);
    try {
      await requestOtp(phone);
    } finally {
      setResending(false);
    }
  };

  return (
    <Screen edges={[]} style={styles.screen}>
      <View style={styles.content}>
        <Text variant="title">Enter code</Text>
        <Text variant="body" color="muted">
          We sent a 6-digit code to {phone}.
        </Text>
        <Input
          label="Verification code"
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={setCode}
          placeholder="482913"
        />
        {error && (
          <Text variant="caption" color="destructive">
            {error}
          </Text>
        )}
        <Button
          label={loading ? "Verifying…" : "Verify"}
          onPress={() => void onSubmit()}
          loading={loading}
          disabled={code.trim().length !== 6}
        />
        <Button label={resending ? "Sending…" : "Resend code"} variant="ghost" onPress={() => void onResend()} disabled={resending} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: "center" },
  content: { paddingHorizontal: 24, gap: 16 },
});
