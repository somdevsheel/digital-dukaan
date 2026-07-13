import { FlatList, StyleSheet, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Screen, Text, Card, Button, Skeleton } from "@platform/ui-native";
import { apiFetch } from "../lib/api";
import { formatRupees } from "../lib/format";
import { useAuth } from "../lib/auth-context";
import type { DeliveryEarning, Wallet } from "../lib/types";

const EARNING_LABEL: Record<DeliveryEarning["type"], string> = {
  DELIVERY_FEE: "Delivery fee",
  INCENTIVE: "Incentive",
  DEDUCTION: "Deduction",
};

export function EarningsScreen() {
  const { logout } = useAuth();
  const { data: wallet, isLoading: loadingWallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => apiFetch<Wallet>("/delivery-partners/me/wallet"),
  });

  const { data: earnings, isLoading: loadingEarnings } = useQuery({
    queryKey: ["earnings"],
    queryFn: () => apiFetch<DeliveryEarning[]>("/delivery-partners/me/earnings"),
  });

  return (
    <Screen>
      <FlatList
        data={loadingEarnings ? [] : (earnings ?? [])}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.gap}>
            <Text variant="title">Earnings</Text>
            {loadingWallet ? (
              <Skeleton height={90} />
            ) : (
              <Card style={styles.walletCard}>
                <Text variant="caption" color="muted">
                  Available balance
                </Text>
                <Text variant="title">{formatRupees(wallet?.availableBalancePaise ?? 0)}</Text>
                {(wallet?.cashToRemitPaise ?? 0) > 0 && (
                  <Text variant="caption" color="destructive">
                    Cash to remit: {formatRupees(wallet!.cashToRemitPaise)}
                  </Text>
                )}
              </Card>
            )}
            <Text variant="subtitle">Recent transactions</Text>
          </View>
        }
        ListEmptyComponent={!loadingEarnings ? <Text color="muted">No earnings yet.</Text> : null}
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <View>
              <Text variant="body">{EARNING_LABEL[item.type]}</Text>
              <Text variant="caption" color="muted">
                {new Date(item.createdAt).toLocaleDateString()} · {item.status === "PAID" ? "Paid" : "Pending"}
              </Text>
            </View>
            <Text variant="subtitle" color={item.amountPaise < 0 ? "destructive" : undefined}>
              {item.amountPaise < 0 ? "-" : "+"}
              {formatRupees(Math.abs(item.amountPaise))}
            </Text>
          </Card>
        )}
        ListFooterComponent={<Button label="Sign out" variant="ghost" onPress={() => void logout()} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 10 },
  gap: { gap: 12 },
  walletCard: { gap: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
