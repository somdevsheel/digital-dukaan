import { useMemo, useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, View } from "react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Screen, Text, Badge, Card, Skeleton, useTheme } from "@platform/ui-native";
import { apiFetch } from "../lib/api";
import { formatDistance } from "../lib/format";
import type { BusinessSearchHit, BusinessSearchResult } from "../lib/types";
import type { RootStackScreenProps } from "../navigation/types";

type FilterKey = "openNow" | "delivery" | "pickup" | "verified" | "rating4";

const FILTERS: { key: FilterKey; label: string; param: string; value: string }[] = [
  { key: "openNow", label: "Open Now", param: "filter[openNow]", value: "true" },
  { key: "delivery", label: "Delivery", param: "filter[deliveryAvailable]", value: "true" },
  { key: "pickup", label: "Pickup", param: "filter[pickupAvailable]", value: "true" },
  { key: "rating4", label: "Rating 4+", param: "filter[rating]", value: "4" },
  { key: "verified", label: "Verified", param: "filter[verified]", value: "true" },
];

export function SearchScreen({ route, navigation }: RootStackScreenProps<"Search">) {
  const theme = useTheme();
  const params = route.params ?? {};
  const [active, setActive] = useState<Set<FilterKey>>(new Set());

  const toggle = (key: FilterKey) => {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const queryString = useMemo(() => {
    const qs = new URLSearchParams();
    if (params.q) qs.set("q", params.q);
    if (params.cityId) qs.set("cityId", params.cityId);
    if (params.businessTypeId) qs.set("businessTypeId", params.businessTypeId);
    for (const f of FILTERS) {
      if (active.has(f.key)) qs.set(f.param, f.value);
    }
    return qs.toString();
  }, [params.q, params.cityId, params.businessTypeId, active]);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["search", queryString],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      apiFetch<BusinessSearchResult>(`/businesses?${queryString}${pageParam ? `&cursor=${pageParam}` : ""}`),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const hits: BusinessSearchHit[] = data?.pages.flatMap((p) => p.hits) ?? [];

  return (
    <Screen edges={[]} style={styles.screen}>
      <View style={[styles.filterRow, { borderColor: theme.border }]}>
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(f) => f.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <Pressable onPress={() => toggle(item.key)}>
              <Badge label={item.label} variant={active.has(item.key) ? "default" : "outline"} />
            </Pressable>
          )}
        />
      </View>

      {isLoading ? (
        <View style={styles.list}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={76} />
          ))}
        </View>
      ) : (
        <FlatList
          data={hits}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onEndReached={() => {
            if (hasNextPage) void fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <Text color="muted" style={styles.empty}>
              No businesses found. Try widening your search or clearing a filter.
            </Text>
          }
          ListFooterComponent={isFetchingNextPage ? <Skeleton height={76} /> : null}
          renderItem={({ item }) => (
            <Pressable onPress={() => navigation.navigate("BusinessProfile", { slug: item.slug })}>
              <Card style={styles.card}>
                <View style={styles.cardContent}>
                  <View style={[styles.logo, { backgroundColor: theme.muted }]}>
                    {item.logoUrl && <Image source={{ uri: item.logoUrl }} style={styles.logo} />}
                  </View>
                  <View style={styles.cardBody}>
                    <View style={styles.cardRow}>
                      <Text variant="subtitle" numberOfLines={1} style={styles.cardTitle}>
                        {item.name}
                      </Text>
                      {!item.isOpen && <Badge label="Closed" variant="secondary" />}
                    </View>
                    <Text variant="caption" color="muted">
                      {item.businessTypeName}
                    </Text>
                    <View style={styles.metaRow}>
                      <Text variant="caption">⭐ {item.ratingAvg > 0 ? item.ratingAvg.toFixed(1) : "New"}</Text>
                      {item.distanceMeters !== null && (
                        <Text variant="caption" color="muted">
                          {formatDistance(item.distanceMeters)}
                        </Text>
                      )}
                      {item.deliveryEnabled && <Badge label="Delivery" variant="outline" />}
                      {item.pickupEnabled && <Badge label="Pickup" variant="outline" />}
                    </View>
                  </View>
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  filterRow: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  filterList: { paddingHorizontal: 12, gap: 8 },
  list: { padding: 12, gap: 10 },
  card: { gap: 4 },
  cardContent: { flexDirection: "row", gap: 12 },
  logo: { width: 56, height: 56, borderRadius: 8 },
  cardBody: { flex: 1, gap: 4 },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { flexShrink: 1 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 2 },
  empty: { padding: 24, textAlign: "center" },
});
