import { useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Screen, Text, Card, Button, Input, Badge } from "@platform/ui-native";
import { apiFetch, ApiError } from "../lib/api";
import { formatDistance, formatRupees } from "../lib/format";
import type { DeliveryRecord, DeliveryStatus } from "../lib/types";
import type { RootStackScreenProps } from "../navigation/types";

export function ActiveDeliveryScreen({ route, navigation }: RootStackScreenProps<"ActiveDelivery">) {
  const { offer } = route.params;
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<DeliveryStatus>("ASSIGNED");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);

  const markPickedUp = useMutation({
    mutationFn: () => apiFetch<DeliveryRecord>(`/delivery-partners/deliveries/${offer.deliveryId}/pickup`, { method: "POST" }),
    onSuccess: (result) => setStatus(result.status),
    onError: (err) => setError(err instanceof ApiError ? err.message : "Couldn't update this delivery."),
  });

  const markDelivered = useMutation({
    mutationFn: () =>
      apiFetch<DeliveryRecord>(`/delivery-partners/deliveries/${offer.deliveryId}/complete`, {
        method: "POST",
        body: { otp: otp.trim() },
      }),
    onSuccess: async (result) => {
      setStatus(result.status);
      await queryClient.invalidateQueries({ queryKey: ["delivery-partner-me"] });
      await queryClient.invalidateQueries({ queryKey: ["wallet"] });
      navigation.goBack();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Invalid OTP. Please check with the customer."),
  });

  const step = status === "ASSIGNED" ? 1 : 2;

  return (
    <Screen edges={[]}>
      <View style={styles.content}>
        <Card style={styles.summaryCard}>
          <Text variant="subtitle">{offer.businessName}</Text>
          <Text variant="caption" color="muted">
            {formatDistance(offer.distanceMeters)} · Earn {formatRupees(offer.estimatedEarningsPaise)}
          </Text>
        </Card>

        <Badge label={`Step ${step} of 2 — ${step === 1 ? "Head to pickup" : "Head to drop"}`} />

        {step === 1 ? (
          <Card style={styles.stepCard}>
            <Text variant="body" color="muted">
              Pickup address
            </Text>
            <Text variant="subtitle">{offer.pickupAddress}</Text>
            <Button
              label="Navigate"
              variant="outline"
              onPress={() => {
                void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(offer.pickupAddress)}`);
              }}
            />
            <Button
              label={markPickedUp.isPending ? "Updating…" : "Mark Picked Up"}
              onPress={() => {
                setError(null);
                markPickedUp.mutate();
              }}
              loading={markPickedUp.isPending}
            />
          </Card>
        ) : (
          <Card style={styles.stepCard}>
            <Text variant="body" color="muted">
              Drop-off details are shared with the customer once delivery is under way — confirm the address with them directly if needed.
            </Text>
            <Input
              label="Delivery OTP"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="4-digit code from customer"
              style={styles.otpInput}
            />
            <Button
              label={markDelivered.isPending ? "Confirming…" : "Mark Delivered"}
              onPress={() => {
                setError(null);
                markDelivered.mutate();
              }}
              loading={markDelivered.isPending}
              disabled={otp.trim().length !== 4}
            />
          </Card>
        )}

        {error && (
          <Text variant="caption" color="destructive">
            {error}
          </Text>
        )}
        <Text variant="caption" color="muted">
          Order pickup/drop live map tracking requires the realtime location feed — not yet wired into this screen.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14 },
  summaryCard: { gap: 2 },
  stepCard: { gap: 10 },
  otpInput: { fontSize: 24, letterSpacing: 8, textAlign: "center" },
});
