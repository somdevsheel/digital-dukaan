import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Screen, Text, Badge, Card, Button, Skeleton } from "@platform/ui-native";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import type { Business } from "../lib/types";
import type { RootStackScreenProps } from "../navigation/types";

const VERIFICATION_BADGE: Record<Business["verificationStatus"], "warning" | "success" | "destructive" | "secondary"> = {
  PENDING: "warning",
  VERIFIED: "success",
  REJECTED: "destructive",
  SUSPENDED: "secondary",
};

export function BusinessListScreen({ navigation }: RootStackScreenProps<"BusinessList">) {
  const { logout } = useAuth();

  const { data: businesses, isLoading } = useQuery({
    queryKey: ["merchant", "businesses"],
    queryFn: () => apiFetch<Business[]>("/merchant/businesses"),
  });

  if (isLoading) {
    return (
      <Screen style={styles.padding}>
        <Skeleton height={80} />
        <Skeleton height={80} />
      </Screen>
    );
  }

  if (!businesses || businesses.length === 0) {
    return (
      <Screen style={[styles.padding, styles.empty]}>
        <Text variant="subtitle">Register your business</Text>
        <Text variant="body" color="muted" style={styles.emptyText}>
          You don't have a storefront yet. Set one up to start listing your catalog and taking orders.
        </Text>
        <Button label="Register your business" onPress={() => navigation.navigate("RegisterBusiness")} />
        <Button label="Log out" variant="ghost" onPress={() => void logout()} />
      </Screen>
    );
  }

  return (
    <Screen edges={[]}>
      <FlatList
        data={businesses}
        keyExtractor={(b) => b.id}
        contentContainerStyle={styles.list}
        ListFooterComponent={
          <View style={styles.footerActions}>
            <Button label="+ Register another business" variant="outline" onPress={() => navigation.navigate("RegisterBusiness")} />
            <Button label="Log out" variant="ghost" onPress={() => void logout()} />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate("BusinessTabs", { businessId: item.id, businessName: item.name })}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Card style={styles.card}>
              <View style={styles.cardRow}>
                <Text variant="subtitle" numberOfLines={1} style={styles.flexShrink}>
                  {item.name}
                </Text>
                <View style={styles.badgeRow}>
                  <Badge label={item.isOpen ? "Open" : "Closed"} variant={item.isOpen ? "success" : "secondary"} />
                  <Badge label={item.verificationStatus} variant={VERIFICATION_BADGE[item.verificationStatus]} />
                </View>
              </View>
              <Text variant="caption" color="muted">
                {item.addressLine}
              </Text>
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  padding: { padding: 16, gap: 12 },
  empty: { justifyContent: "center", gap: 10 },
  emptyText: { marginBottom: 8 },
  list: { padding: 16, gap: 10 },
  pressed: { opacity: 0.6 },
  card: { gap: 6 },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  flexShrink: { flexShrink: 1 },
  badgeRow: { flexDirection: "row", gap: 6 },
  footerActions: { gap: 10, marginTop: 8 },
});
