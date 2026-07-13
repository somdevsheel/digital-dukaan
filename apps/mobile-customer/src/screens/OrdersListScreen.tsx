import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Screen, Text, Card, Badge, Skeleton } from "@platform/ui-native";
import { apiFetch } from "../lib/api";
import { formatRupees } from "../lib/format";
import type { Order } from "../lib/types";
import type { MainTabScreenProps } from "../navigation/types";

export function OrdersListScreen({ navigation }: MainTabScreenProps<"OrdersTab">) {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => apiFetch<Order[]>("/me/orders"),
  });

  return (
    <Screen>
      <FlatList
        data={isLoading ? [] : (orders ?? [])}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text variant="title" style={styles.title}>Your orders</Text>}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.list}>
              <Skeleton height={70} />
              <Skeleton height={70} />
            </View>
          ) : (
            <Text color="muted" style={styles.empty}>
              No orders yet. Find a shop and place your first order.
            </Text>
          )
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => navigation.navigate("OrderTracking", { orderId: item.id })}>
            <Card style={styles.card}>
              <View style={styles.row}>
                <Text variant="subtitle">#{item.orderNumber}</Text>
                <Badge label={item.status} variant={item.status === "DELIVERED" || item.status === "COMPLETED" ? "success" : "default"} />
              </View>
              <Text variant="caption" color="muted">
                {item.items.length} item{item.items.length === 1 ? "" : "s"} · {formatRupees(item.totalPaise)}
              </Text>
              <Text variant="caption" color="muted">
                {new Date(item.placedAt).toLocaleDateString()}
              </Text>
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 10 },
  title: { marginBottom: 4 },
  empty: { padding: 24, textAlign: "center" },
  card: { gap: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
