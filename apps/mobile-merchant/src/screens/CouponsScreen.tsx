import { FlatList, StyleSheet, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Screen, Text, Badge, Card, Button, Skeleton, useTheme } from "@platform/ui-native";
import { apiFetch } from "../lib/api";
import { formatDateIso } from "../lib/format";
import type { Coupon } from "../lib/types";
import type { RootStackScreenProps } from "../navigation/types";

function formatValue(coupon: Coupon): string {
  return coupon.type === "PERCENT" ? `${coupon.value}% off` : `₹${(coupon.value / 100).toFixed(2)} off`;
}

export function CouponsScreen({ route, navigation }: RootStackScreenProps<"Coupons">) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { businessId } = route.params;

  const { data: coupons, isLoading } = useQuery({
    queryKey: ["merchant", "coupons", businessId],
    queryFn: () => apiFetch<Coupon[]>(`/merchant/businesses/${businessId}/coupons`),
  });

  const toggleActive = useMutation({
    mutationFn: ({ couponId, isActive }: { couponId: string; isActive: boolean }) =>
      apiFetch(`/merchant/businesses/${businessId}/coupons/${couponId}`, { method: "PATCH", body: { isActive } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["merchant", "coupons", businessId] }),
  });

  return (
    <Screen edges={[]} style={styles.screen}>
      {isLoading ? (
        <View style={styles.list}>
          <Skeleton height={70} />
          <Skeleton height={70} />
        </View>
      ) : (
        <FlatList
          data={coupons ?? []}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text color="muted" style={styles.empty}>
              No coupons yet.
            </Text>
          }
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.row}>
                <Text variant="subtitle">{item.code}</Text>
                <Badge label={item.isActive ? "Active" : "Inactive"} variant={item.isActive ? "success" : "secondary"} />
              </View>
              <Text variant="body" color="muted">
                {formatValue(item)} · expires {formatDateIso(item.expiresAt)}
              </Text>
              <Button
                label={item.isActive ? "Deactivate" : "Activate"}
                variant="ghost"
                disabled={toggleActive.isPending}
                onPress={() => toggleActive.mutate({ couponId: item.id, isActive: !item.isActive })}
              />
            </Card>
          )}
        />
      )}

      <View style={[styles.footer, { borderColor: theme.border }]}>
        <Button label="+ Add Coupon" onPress={() => navigation.navigate("CouponForm", { businessId })} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { padding: 16, gap: 10, paddingBottom: 90 },
  empty: { padding: 24, textAlign: "center" },
  card: { gap: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
});
