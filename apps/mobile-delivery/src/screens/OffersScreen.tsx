import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Switch, View } from "react-native";
import * as Location from "expo-location";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Screen, Text, Card, Button, Skeleton, useTheme } from "@platform/ui-native";
import { apiFetch } from "../lib/api";
import { formatDistance, formatRupees } from "../lib/format";
import type { DeliveryOffer, DeliveryPartner, DeliveryRecord } from "../lib/types";
import type { MainTabScreenProps } from "../navigation/types";

export function OffersScreen({ navigation }: MainTabScreenProps<"OffersTab">) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const { data: partner } = useQuery({
    queryKey: ["delivery-partner-me"],
    queryFn: () => apiFetch<DeliveryPartner>("/delivery-partners/me"),
  });

  useEffect(() => {
    void (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        setLocationError("Location permission is needed to see nearby offers.");
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
    })();
  }, []);

  const setAvailability = useMutation({
    mutationFn: (isAvailable: boolean) => apiFetch("/delivery-partners/me/availability", { method: "PATCH", body: { isAvailable } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["delivery-partner-me"] }),
  });

  const { data: offers, isLoading } = useQuery({
    queryKey: ["offers", coords?.latitude, coords?.longitude],
    queryFn: () => apiFetch<DeliveryOffer[]>(`/delivery-partners/me/offers?lat=${coords!.latitude}&lng=${coords!.longitude}`),
    enabled: !!coords && !!partner?.isAvailable,
    refetchInterval: 10_000,
  });

  const accept = useMutation({
    mutationFn: (offer: DeliveryOffer) =>
      apiFetch<DeliveryRecord>(`/delivery-partners/deliveries/${offer.deliveryId}/accept`, {
        method: "POST",
        idempotencyKey: `accept-${offer.deliveryId}`,
      }),
    onSuccess: (_result, offer) => {
      void queryClient.invalidateQueries({ queryKey: ["offers"] });
      navigation.navigate("ActiveDelivery", { offer });
    },
  });

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text variant="title">Offers</Text>
          <Text variant="caption" color="muted">
            {partner?.isAvailable ? "You're online" : "You're offline"}
          </Text>
        </View>
        <Switch
          value={!!partner?.isAvailable}
          onValueChange={(value) => setAvailability.mutate(value)}
          trackColor={{ true: theme.primary, false: theme.border }}
        />
      </View>

      {locationError && (
        <Text variant="caption" color="destructive" style={styles.padded}>
          {locationError}
        </Text>
      )}

      {!partner?.isAvailable ? (
        <Text color="muted" style={styles.padded}>
          Go online to start receiving delivery offers.
        </Text>
      ) : isLoading ? (
        <View style={styles.list}>
          <Skeleton height={120} />
        </View>
      ) : (
        <FlatList
          data={offers ?? []}
          keyExtractor={(item) => item.deliveryId}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text color="muted" style={styles.padded}>
              No offers nearby right now. We'll refresh automatically.
            </Text>
          }
          renderItem={({ item }) => (
            <Card style={styles.offerCard}>
              <Text variant="subtitle">{item.businessName}</Text>
              <Text variant="caption" color="muted">
                Pickup: {item.pickupAddress}
              </Text>
              <View style={styles.offerMeta}>
                <Text variant="body">{formatDistance(item.distanceMeters)} away</Text>
                <Text variant="subtitle" color="primary">
                  Earn {formatRupees(item.estimatedEarningsPaise)}
                </Text>
              </View>
              <Button
                label={accept.isPending ? "Accepting…" : "Accept"}
                onPress={() => accept.mutate(item)}
                loading={accept.isPending}
                disabled={accept.isPending}
              />
            </Card>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 },
  padded: { paddingHorizontal: 16 },
  list: { padding: 16, gap: 10 },
  offerCard: { gap: 6 },
  offerMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 },
});
