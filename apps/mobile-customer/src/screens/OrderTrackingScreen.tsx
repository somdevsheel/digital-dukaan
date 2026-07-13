import { useEffect } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Screen, Text, Card, Badge, StatusStepper, Skeleton, useTheme } from "@platform/ui-native";
import { apiFetch } from "../lib/api";
import { formatRupees } from "../lib/format";
import { orderSteps } from "../lib/types";
import type { Order, OrderStatusHistoryEntry } from "../lib/types";
import type { RootStackScreenProps } from "../navigation/types";
import { connectSocket, joinOrderTracking, leaveOrderTracking } from "../lib/socket";

interface TrackingResponse {
  order: Order;
  history: OrderStatusHistoryEntry[];
}

export function OrderTrackingScreen({ route }: RootStackScreenProps<"OrderTracking">) {
  const theme = useTheme();
  const { orderId } = route.params;
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["order-tracking", orderId],
    queryFn: () => apiFetch<TrackingResponse>(`/orders/${orderId}/track`),
    refetchInterval: 20_000,
  });

  useEffect(() => {
    const socket = connectSocket();
    joinOrderTracking(orderId);
    const onStatusChanged = (payload: { orderId: string }) => {
      if (payload.orderId === orderId) {
        void queryClient.invalidateQueries({ queryKey: ["order-tracking", orderId] });
      }
    };
    socket.on("order.status_changed", onStatusChanged);
    return () => {
      socket.off("order.status_changed", onStatusChanged);
      leaveOrderTracking(orderId);
    };
  }, [orderId, queryClient]);

  if (isLoading || !data) {
    return (
      <Screen edges={[]} style={styles.padding}>
        <Skeleton height={80} />
        <Skeleton height={120} />
      </Screen>
    );
  }

  const { order, history } = data;
  const stepList = orderSteps(order.fulfillmentType);
  const currentIndex = stepList.findIndex((s) => s.status === order.status);
  const steps = stepList.map((s, i) => ({
    label: s.label,
    done: order.status !== "CANCELLED" && order.status !== "REJECTED" && currentIndex >= 0 && i <= currentIndex,
    active: s.status === order.status,
  }));

  return (
    <Screen edges={[]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text variant="title">#{order.orderNumber}</Text>
          {(order.status === "CANCELLED" || order.status === "REJECTED") && <Badge label={order.status} variant="destructive" />}
        </View>

        {order.status !== "CANCELLED" && order.status !== "REJECTED" ? (
          <Card style={styles.stepperCard}>
            <StatusStepper steps={steps} />
          </Card>
        ) : (
          <Card style={styles.stepperCard}>
            <Text color="muted">{order.cancelReason ?? "This order was not fulfilled."}</Text>
          </Card>
        )}

        <Text variant="subtitle" style={styles.sectionTitle}>
          Items
        </Text>
        <Card style={styles.itemsCard}>
          {order.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text variant="body" style={styles.flexShrink}>
                {item.nameSnapshot}
                {item.variantSnapshot ? ` · ${item.variantSnapshot}` : ""} × {item.quantity}
              </Text>
              <Text variant="body">{formatRupees(item.totalPaise)}</Text>
            </View>
          ))}
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SummaryLine label="Subtotal" value={order.subtotalPaise} />
          {order.deliveryFeePaise > 0 && <SummaryLine label="Delivery fee" value={order.deliveryFeePaise} />}
          {order.platformFeePaise > 0 && <SummaryLine label="Platform fee" value={order.platformFeePaise} />}
          {order.discountPaise > 0 && <SummaryLine label="Discount" value={-order.discountPaise} />}
          <View style={styles.itemRow}>
            <Text variant="subtitle">Total</Text>
            <Text variant="subtitle">{formatRupees(order.totalPaise)}</Text>
          </View>
          <Text variant="caption" color="muted">
            {order.paymentMethod === "COD" ? "Cash on delivery" : `Paid online · ${order.paymentStatus.toLowerCase()}`}
          </Text>
        </Card>

        <Text variant="subtitle" style={styles.sectionTitle}>
          Status history
        </Text>
        <Card style={styles.itemsCard}>
          {history.map((entry, i) => (
            <Text key={i} variant="caption" color="muted">
              {entry.toStatus} · {new Date(entry.createdAt).toLocaleString()}
            </Text>
          ))}
        </Card>
      </ScrollView>
    </Screen>
  );
}

function SummaryLine({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.itemRow}>
      <Text variant="caption" color="muted">
        {label}
      </Text>
      <Text variant="caption" color="muted">
        {formatRupees(value)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  padding: { padding: 16, gap: 12 },
  content: { padding: 16, gap: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  stepperCard: { paddingVertical: 20 },
  sectionTitle: { marginTop: -6 },
  itemsCard: { gap: 6 },
  itemRow: { flexDirection: "row", justifyContent: "space-between" },
  flexShrink: { flexShrink: 1 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 4 },
});
