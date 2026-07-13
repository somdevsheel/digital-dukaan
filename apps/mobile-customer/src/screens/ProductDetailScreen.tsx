import { useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Screen, Text, Button, Skeleton, useTheme } from "@platform/ui-native";
import { apiFetch } from "../lib/api";
import { formatRupees } from "../lib/format";
import type { Product } from "../lib/types";
import type { RootStackScreenProps } from "../navigation/types";

export function ProductDetailScreen({ route, navigation }: RootStackScreenProps<"ProductDetail">) {
  const theme = useTheme();
  const { businessId, productId } = route.params;
  const queryClient = useQueryClient();
  const [variantId, setVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const { data: products, isLoading } = useQuery({
    queryKey: ["business-products", businessId],
    queryFn: () => apiFetch<Product[]>(`/businesses/${businessId}/products`),
  });

  const product = products?.find((p) => p.id === productId);
  const variant = product?.variants.find((v) => v.id === (variantId ?? product?.variants[0]?.id));

  const addToCart = useMutation({
    mutationFn: () =>
      apiFetch(`/carts/${businessId}/items`, {
        method: "POST",
        body: { productVariantId: variant!.id, quantity },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cart", businessId] });
      navigation.goBack();
    },
  });

  if (isLoading || !product) {
    return (
      <Screen edges={[]} style={styles.padding}>
        <Skeleton height={280} />
      </Screen>
    );
  }

  const maxStock = variant?.stockQuantity ?? 0;

  return (
    <Screen edges={[]}>
      <View style={styles.content}>
        <View style={[styles.image, { backgroundColor: theme.muted }]}>
          {product.images[0] && <Image source={{ uri: product.images[0].url }} style={styles.image} />}
        </View>
        <Text variant="title">{product.name}</Text>
        {product.description && (
          <Text variant="body" color="muted">
            {product.description}
          </Text>
        )}
        <Text variant="subtitle">{variant ? formatRupees(variant.pricePaise) : "—"}</Text>

        {product.variants.length > 1 && (
          <View style={styles.chipRow}>
            {product.variants.map((v) => {
              const selected = v.id === (variantId ?? product.variants[0]?.id);
              return (
                <Pressable
                  key={v.id}
                  onPress={() => {
                    setVariantId(v.id);
                    setQuantity(1);
                  }}
                  style={[
                    styles.chip,
                    { borderColor: selected ? theme.primary : theme.border, backgroundColor: selected ? theme.primary : "transparent" },
                  ]}
                >
                  <Text style={{ color: selected ? theme.primaryForeground : theme.foreground }}>{v.name}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.stepperRow}>
          <Text variant="body" color="muted">
            Quantity
          </Text>
          <View style={styles.stepper}>
            <Pressable
              style={[styles.stepperButton, { borderColor: theme.border }]}
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              <Text variant="subtitle">–</Text>
            </Pressable>
            <Text variant="subtitle" style={styles.stepperValue}>
              {quantity}
            </Text>
            <Pressable
              style={[styles.stepperButton, { borderColor: theme.border }]}
              onPress={() => setQuantity((q) => Math.min(maxStock || q, q + 1))}
            >
              <Text variant="subtitle">+</Text>
            </Pressable>
          </View>
        </View>

        {maxStock === 0 && (
          <Text color="destructive" variant="caption">
            Out of stock
          </Text>
        )}
      </View>

      <View style={[styles.footer, { borderColor: theme.border }]}>
        <Button
          label={addToCart.isPending ? "Adding…" : `Add to Cart · ${variant ? formatRupees(variant.pricePaise * quantity) : ""}`}
          onPress={() => addToCart.mutate()}
          disabled={!variant || maxStock === 0 || addToCart.isPending}
          loading={addToCart.isPending}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  padding: { padding: 16 },
  content: { padding: 16, gap: 12, flex: 1 },
  image: { width: "100%", aspectRatio: 1, borderRadius: 12 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  stepperRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  stepper: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepperButton: { width: 36, height: 36, borderWidth: 1, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  stepperValue: { minWidth: 24, textAlign: "center" },
  footer: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
});
