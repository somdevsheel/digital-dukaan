import { useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Screen, Text, Badge, Card, Button, StatusStepper, Skeleton, useTheme, type StatusStep } from "@platform/ui-native";
import { apiFetch } from "../lib/api";
import { formatRupees } from "../lib/format";
import type { Order, OrderStatus } from "../lib/types";
import type { BusinessScopedProps } from "../navigation/types";

const FILTERS: { key: OrderStatus | "ALL"; label: string }[] = [
  { key: "PLACED", label: "New" },
  { key: "ACCEPTED", label: "Accepted" },
  { key: "PACKING", label: "Packing" },
  { key: "READY", label: "Ready" },
  { key: "OUT_FOR_DELIVERY", label: "Out for delivery" },
  { key: "ALL", label: "All" },
];

// READY branches by fulfillment type since pickup orders have no delivery partner in the
// loop (Commerce API Design §4.7): the merchant marks them COMPLETED directly instead of
// handing off to OUT_FOR_DELIVERY — same logic as web-merchant's orders page.
function nextAction(order: Order): { label: string; status: OrderStatus } | null {
  switch (order.status) {
    case "ACCEPTED":
      return { label: "Start packing", status: "PACKING" };
    case "PACKING":
      return { label: "Mark ready", status: "READY" };
    case "READY":
      return order.fulfillmentType === "DELIVERY" ? { label: "Send for delivery", status: "OUT_FOR_DELIVERY" } : { label: "Mark complete", status: "COMPLETED" };
    default:
      return null;
  }
}

function stepsFor(order: Order): StatusStep[] {
  const flow: OrderStatus[] =
    order.fulfillmentType === "DELIVERY"
      ? ["PLACED", "ACCEPTED", "PACKING", "READY", "OUT_FOR_DELIVERY"]
      : ["PLACED", "ACCEPTED", "PACKING", "READY", "COMPLETED"];
  const labels = order.fulfillmentType === "DELIVERY" ? ["Placed", "Accepted", "Packing", "Ready", "Out"] : ["Placed", "Accepted", "Packing", "Ready", "Done"];
  const currentIndex = flow.indexOf(order.status);
  return flow.map((status, i) => ({ label: labels[i]!, done: i < currentIndex, active: i === currentIndex }));
}

export function OrdersScreen({ businessId }: BusinessScopedProps) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<OrderStatus | "ALL">("PLACED");

  const { data: orders, isLoading } = useQuery({
    queryKey: ["merchant", "orders", businessId],
    queryFn: () => apiFetch<Order[]>(`/merchant/businesses/${businessId}/orders`),
    refetchInterval: 15_000,
  });

  const updateStatus = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      apiFetch(`/merchant/businesses/${businessId}/orders/${orderId}/status`, {
        method: "PATCH",
        body: { status },
        idempotencyKey: `${orderId}-${status}-${Date.now()}`,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["merchant", "orders", businessId] }),
  });

  const visibleOrders = filter === "ALL" ? (orders ?? []) : (orders ?? []).filter((o) => o.status === filter);
  const countFor = (key: OrderStatus | "ALL") => (orders ?? []).filter((o) => key === "ALL" || o.status === key).length;

  return (
    <Screen edges={[]}>
      <View style={[styles.filterRow, { borderColor: theme.border }]}>
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(f) => f.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <Pressable onPress={() => setFilter(item.key)}>
              <Badge label={`${item.label} (${countFor(item.key)})`} variant={filter === item.key ? "default" : "outline"} />
            </Pressable>
          )}
        />
      </View>

      {isLoading ? (
        <View style={styles.list}>
          <Skeleton height={140} />
          <Skeleton height={140} />
        </View>
      ) : (
        <FlatList
          data={visibleOrders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text color="muted" style={styles.empty}>
              No orders here right now.
            </Text>
          }
          renderItem={({ item: order }) => {
            const action = nextAction(order);
            return (
              <Card style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text variant="subtitle">{order.orderNumber}</Text>
                  <Text variant="body">{formatRupees(order.totalPaise)}</Text>
                </View>
                <Text variant="caption" color="muted">
                  {order.items.length} item{order.items.length === 1 ? "" : "s"} · {order.fulfillmentType === "DELIVERY" ? "Delivery" : "Pickup"}
                </Text>
                <StatusStepper steps={stepsFor(order)} />
                {order.status === "PLACED" ? (
                  <View style={styles.actionRow}>
                    <View style={styles.actionButton}>
                      <Button
                        label="Reject"
                        variant="outline"
                        disabled={updateStatus.isPending}
                        onPress={() => updateStatus.mutate({ orderId: order.id, status: "REJECTED" })}
                      />
                    </View>
                    <View style={styles.actionButton}>
                      <Button
                        label="Accept"
                        disabled={updateStatus.isPending}
                        onPress={() => updateStatus.mutate({ orderId: order.id, status: "ACCEPTED" })}
                      />
                    </View>
                  </View>
                ) : action ? (
                  <Button
                    label={action.label}
                    variant="outline"
                    disabled={updateStatus.isPending}
                    onPress={() => updateStatus.mutate({ orderId: order.id, status: action.status })}
                  />
                ) : ["OUT_FOR_DELIVERY", "DELIVERED"].includes(order.status) ? (
                  <Badge label="Awaiting delivery partner" variant="secondary" />
                ) : null}
              </Card>
            );
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterRow: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  filterList: { paddingHorizontal: 12, gap: 8 },
  list: { padding: 12, gap: 10 },
  empty: { padding: 24, textAlign: "center" },
  orderCard: { gap: 10 },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  actionRow: { flexDirection: "row", gap: 10 },
  actionButton: { flex: 1 },
});
