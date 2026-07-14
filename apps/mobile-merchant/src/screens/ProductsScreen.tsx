import { useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Screen, Text, Badge, Card, Button, Input, Skeleton, useTheme } from "@platform/ui-native";
import { apiFetch } from "../lib/api";
import { formatRupees } from "../lib/format";
import type { Category, Product } from "../lib/types";
import type { BusinessScopedProps } from "../navigation/types";

export function ProductsScreen({ businessId, navigation }: BusinessScopedProps) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");

  const { data: categories } = useQuery({
    queryKey: ["merchant", "categories", businessId],
    queryFn: () => apiFetch<Category[]>(`/merchant/businesses/${businessId}/categories`),
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["merchant", "products", businessId, activeCategoryId],
    queryFn: () =>
      apiFetch<Product[]>(`/merchant/businesses/${businessId}/products${activeCategoryId ? `?categoryId=${activeCategoryId}` : ""}`),
  });

  const createCategory = useMutation({
    mutationFn: (name: string) =>
      apiFetch(`/merchant/businesses/${businessId}/categories`, { method: "POST", body: { name, appliesTo: "PRODUCT" } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["merchant", "categories", businessId] });
      setNewCategoryName("");
    },
  });

  return (
    <Screen edges={[]} style={styles.screen}>
      <View style={[styles.categoryRow, { borderColor: theme.border }]}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          data={[{ id: null, name: "All products" }, ...(categories ?? [])]}
          keyExtractor={(c) => c.id ?? "all"}
          renderItem={({ item }) => (
            <Pressable onPress={() => setActiveCategoryId(item.id)}>
              <Badge label={item.name} variant={activeCategoryId === item.id ? "default" : "outline"} />
            </Pressable>
          )}
          ListFooterComponent={
            <View style={styles.addCategory}>
              <Input
                placeholder="New category"
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                style={styles.addCategoryInput}
                onSubmitEditing={() => newCategoryName.trim() && createCategory.mutate(newCategoryName.trim())}
              />
            </View>
          }
        />
      </View>

      {isLoading ? (
        <View style={styles.list}>
          <Skeleton height={64} />
          <Skeleton height={64} />
        </View>
      ) : (
        <FlatList
          data={products ?? []}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text color="muted" style={styles.empty}>
              No products yet. Add your first one to start selling.
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate("ProductForm", { businessId, productId: item.id })}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Card style={styles.productCard}>
                <View style={styles.productRow}>
                  <Text variant="body" numberOfLines={1} style={styles.flexShrink}>
                    {item.name}
                  </Text>
                  <Text variant="body">{formatRupees(item.basePricePaise)}</Text>
                </View>
                <View style={styles.productRow}>
                  <Text variant="caption" color="muted">
                    Stock: {item.variants[0]?.stockQuantity ?? 0}
                  </Text>
                  <Badge label={item.isActive ? "Active" : "Inactive"} variant={item.isActive ? "success" : "secondary"} />
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}

      <View style={[styles.footer, { borderColor: theme.border }]}>
        <Button label="+ Add Product" onPress={() => navigation.navigate("ProductForm", { businessId })} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  categoryRow: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  categoryList: { paddingHorizontal: 12, gap: 8, alignItems: "center" },
  addCategory: { marginLeft: 4 },
  addCategoryInput: { width: 140 },
  list: { padding: 12, gap: 10, paddingBottom: 90 },
  empty: { padding: 24, textAlign: "center" },
  pressed: { opacity: 0.6 },
  productCard: { gap: 4 },
  productRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  flexShrink: { flexShrink: 1 },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
});
