import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Screen, Text, Card, Skeleton, useTheme } from "@platform/ui-native";
import { apiFetch } from "../lib/api";
import { formatRupees } from "../lib/format";
import type { SalesRange, SalesSummary } from "../lib/types";
import type { RootStackScreenProps } from "../navigation/types";

const RANGES: { key: SalesRange; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
];

function formatDayLabel(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" });
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.statTile}>
      <Text variant="caption" color="muted">
        {label}
      </Text>
      <Text variant="title" style={styles.statValue}>
        {value}
      </Text>
    </Card>
  );
}

function RevenueTrendChart({ trend }: { trend: SalesSummary["trend"] }) {
  const theme = useTheme();
  const max = Math.max(...trend.map((t) => t.revenuePaise), 1);
  const allZero = trend.every((t) => t.revenuePaise === 0);

  return (
    <Card style={styles.chartCard}>
      <Text variant="caption" color="muted" style={styles.chartTitle}>
        7-DAY REVENUE TREND
      </Text>
      {allZero ? (
        <Text color="muted" style={styles.chartEmpty}>
          No sales in the last 7 days yet.
        </Text>
      ) : (
        <View style={styles.chartRow}>
          {trend.map((day) => (
            <View key={day.date} style={styles.chartBarColumn}>
              <View style={styles.chartBarTrack}>
                <View
                  style={[
                    styles.chartBar,
                    { backgroundColor: theme.primary, height: `${Math.max((day.revenuePaise / max) * 100, day.revenuePaise > 0 ? 4 : 0)}%` },
                  ]}
                />
              </View>
              <Text variant="caption" color="muted" style={styles.chartLabel}>
                {formatDayLabel(day.date)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

export function SalesScreen({ route }: RootStackScreenProps<"Sales">) {
  const theme = useTheme();
  const { businessId } = route.params;
  const [range, setRange] = useState<SalesRange>("today");

  const { data, isLoading } = useQuery({
    queryKey: ["merchant", "sales", businessId, range],
    queryFn: () => apiFetch<SalesSummary>(`/merchant/businesses/${businessId}/analytics/sales?range=${range}`),
  });

  return (
    <Screen edges={[]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.chipRow}>
          {RANGES.map((r) => {
            const selected = range === r.key;
            return (
              <Pressable
                key={r.key}
                onPress={() => setRange(r.key)}
                style={[styles.chip, { borderColor: selected ? theme.primary : theme.border, backgroundColor: selected ? theme.primary : "transparent" }]}
              >
                <Text style={{ color: selected ? theme.primaryForeground : theme.foreground }}>{r.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {isLoading || !data ? (
          <View style={styles.statGrid}>
            <Skeleton height={80} />
            <Skeleton height={80} />
            <Skeleton height={80} />
            <Skeleton height={80} />
          </View>
        ) : (
          <>
            <View style={styles.statGrid}>
              <StatTile label="Revenue" value={formatRupees(data.revenuePaise)} />
              <StatTile label="Orders" value={String(data.orderCount)} />
              <StatTile label="New customers" value={String(data.newCustomerCount)} />
              <StatTile label="Avg. order value" value={data.orderCount > 0 ? formatRupees(data.revenuePaise / data.orderCount) : formatRupees(0)} />
            </View>
            <RevenueTrendChart trend={data.trend} />
            <Text variant="caption" color="muted" style={styles.footnote}>
              Figures refresh periodically from a pre-aggregated rollup, not live — they may lag by up to ~15 minutes.
            </Text>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  chipRow: { flexDirection: "row", gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statTile: { width: "47%", gap: 4 },
  statValue: { marginTop: 2 },
  chartCard: { gap: 4 },
  chartTitle: { marginBottom: 8 },
  chartEmpty: { paddingVertical: 32, textAlign: "center" },
  chartRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, height: 160 },
  chartBarColumn: { flex: 1, alignItems: "center", gap: 6 },
  chartBarTrack: { width: "100%", height: 128, justifyContent: "flex-end" },
  chartBar: { width: "100%", borderRadius: 3, minHeight: 2 },
  chartLabel: { fontSize: 10 },
  footnote: { marginTop: 4 },
});
