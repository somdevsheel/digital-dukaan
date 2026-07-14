import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Screen, Text, Input, Button, useTheme } from "@platform/ui-native";
import { apiFetch, ApiError } from "../lib/api";
import type { Category, Product } from "../lib/types";
import type { RootStackScreenProps } from "../navigation/types";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function ProductFormScreen({ route, navigation }: RootStackScreenProps<"ProductForm">) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { businessId, productId } = route.params;

  const { data: categories } = useQuery({
    queryKey: ["merchant", "categories", businessId],
    queryFn: () => apiFetch<Category[]>(`/merchant/businesses/${businessId}/categories`),
  });

  // No single GET-by-id endpoint for a merchant product — prefill from the same unfiltered
  // list the Products screen itself reads from, same as web-merchant's edit dialog does.
  const { data: products } = useQuery({
    queryKey: ["merchant", "products", businessId, null],
    queryFn: () => apiFetch<Product[]>(`/merchant/businesses/${businessId}/products`),
    enabled: !!productId,
  });
  const editingProduct = productId ? products?.find((p) => p.id === productId) : undefined;

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [priceRupees, setPriceRupees] = useState("");
  const [stock, setStock] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      setCategoryId(editingProduct.categoryId);
      setPriceRupees(String(editingProduct.basePricePaise / 100));
      setStock(String(editingProduct.variants[0]?.stockQuantity ?? 0));
    }
  }, [editingProduct]);

  const save = useMutation({
    mutationFn: async () => {
      const pricePaise = Math.round(Number(priceRupees) * 100);
      if (editingProduct) {
        await apiFetch(`/merchant/businesses/${businessId}/products/${editingProduct.id}`, {
          method: "PATCH",
          body: { name: name.trim(), ...(categoryId ? { categoryId } : {}), basePricePaise: pricePaise },
        });
        const variantId = editingProduct.variants[0]?.id;
        if (variantId) {
          await apiFetch(`/merchant/businesses/${businessId}/products/${editingProduct.id}/variants/${variantId}`, {
            method: "PATCH",
            body: { pricePaise, stockQuantity: Number(stock) || 0 },
          });
        }
      } else {
        await apiFetch(`/merchant/businesses/${businessId}/products`, {
          method: "POST",
          body: {
            ...(categoryId ? { categoryId } : {}),
            name: name.trim(),
            slug: `${slugify(name)}-${Date.now().toString(36)}`,
            basePricePaise: pricePaise,
            variants: [{ name: "Default", pricePaise, stockQuantity: Number(stock) || 0 }],
          },
        });
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["merchant", "products", businessId] });
      navigation.goBack();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again."),
  });

  const canSubmit = name.trim().length > 0 && priceRupees.trim().length > 0 && !Number.isNaN(Number(priceRupees));

  return (
    <Screen edges={[]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Input label="Name" value={name} onChangeText={setName} />

        <Text variant="subtitle" style={styles.sectionTitle}>
          Category (optional)
        </Text>
        <View style={styles.chipRow}>
          {categories?.map((category) => {
            const selected = categoryId === category.id;
            return (
              <Pressable
                key={category.id}
                onPress={() => setCategoryId(selected ? null : category.id)}
                style={[styles.chip, { borderColor: selected ? theme.primary : theme.border, backgroundColor: selected ? theme.primary : "transparent" }]}
              >
                <Text style={{ color: selected ? theme.primaryForeground : theme.foreground }}>{category.name}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.row}>
          <Input label="Price, ₹" value={priceRupees} onChangeText={setPriceRupees} keyboardType="decimal-pad" style={styles.rowField} />
          <Input label="Stock" value={stock} onChangeText={setStock} keyboardType="number-pad" style={styles.rowField} />
        </View>

        {error && (
          <Text variant="caption" color="destructive">
            {error}
          </Text>
        )}
        <Button
          label={save.isPending ? "Saving…" : editingProduct ? "Save changes" : "Add product"}
          onPress={() => {
            setError(null);
            save.mutate();
          }}
          loading={save.isPending}
          disabled={!canSubmit || save.isPending}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  sectionTitle: { marginTop: 4 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  row: { flexDirection: "row", gap: 12 },
  rowField: { flex: 1 },
});
