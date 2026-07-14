import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Text, Button, Input, Card, Skeleton, useTheme } from "@platform/ui-native";
import { apiFetch, ApiError } from "../lib/api";
import { formatRupees } from "../lib/format";
import type { Address, Cart, CartItem, Order, Product } from "../lib/types";
import type { RootStackScreenProps } from "../navigation/types";

export function CartScreen({ route, navigation }: RootStackScreenProps<"Cart">) {
  const theme = useTheme();
  const { businessId, deliveryEnabled, pickupEnabled, codEnabled } = route.params;
  const queryClient = useQueryClient();
  const [fulfillmentType, setFulfillmentType] = useState<"DELIVERY" | "PICKUP">(deliveryEnabled ? "DELIVERY" : "PICKUP");
  const [paymentMethod, setPaymentMethod] = useState<"ONLINE" | "COD">("ONLINE");
  const [addressId, setAddressId] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: cart, isLoading } = useQuery({
    queryKey: ["cart", businessId],
    queryFn: () => apiFetch<Cart>(`/carts/${businessId}`),
  });

  const { data: products } = useQuery({
    queryKey: ["business-products", businessId],
    queryFn: () => apiFetch<Product[]>(`/businesses/${businessId}/products`),
  });

  const { data: addresses } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => apiFetch<Address[]>("/me/addresses"),
  });

  // Without this, switching to Delivery leaves `addressId` null until the user happens to
  // tap an address card themselves — the Place Order button just sits disabled with no
  // indication why, which reads as "the button doesn't work". Picks the saved default
  // address, falling back to the first one, the moment there's one to pick.
  useEffect(() => {
    if (fulfillmentType !== "DELIVERY" || addressId || !addresses || addresses.length === 0) return;
    const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
    if (defaultAddress) setAddressId(defaultAddress.id);
  }, [fulfillmentType, addresses, addressId]);

  const productByVariantId = new Map<string, { name: string; variantName: string }>();
  products?.forEach((p) => p.variants.forEach((v) => productByVariantId.set(v.id, { name: p.name, variantName: v.name })));

  const updateQuantity = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      apiFetch(`/carts/${businessId}/items/${itemId}`, { method: "PATCH", body: { quantity } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart", businessId] }),
  });

  const removeItem = useMutation({
    mutationFn: (itemId: string) => apiFetch(`/carts/${businessId}/items/${itemId}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart", businessId] }),
  });

  const placeOrder = useMutation({
    mutationFn: () =>
      apiFetch<{ order: Order }>("/orders", {
        method: "POST",
        idempotencyKey: `${cart!.id}-${Date.now()}`,
        body: {
          businessId,
          cartId: cart!.id,
          fulfillmentType,
          ...(fulfillmentType === "DELIVERY" ? { addressId } : {}),
          paymentMethod,
          ...(couponCode.trim() ? { couponCode: couponCode.trim() } : {}),
        },
      }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["cart", businessId] });
      navigation.replace("OrderTracking", { orderId: result.order.id });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Couldn't place order. Please try again."),
  });

  if (isLoading || !cart) {
    return (
      <Screen edges={[]} style={styles.padding}>
        <Skeleton height={60} />
        <Skeleton height={60} />
      </Screen>
    );
  }

  const subtotalPaise = cart.items.reduce((sum, i) => sum + i.priceSnapshotPaise * i.quantity, 0);
  const canPlaceOrder = cart.items.length > 0 && (fulfillmentType === "PICKUP" || !!addressId) && !placeOrder.isPending;

  return (
    <Screen edges={[]}>
      <FlatList
        data={cart.items}
        keyExtractor={(item) => item.id}
        style={styles.flatList}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cart-outline" size={48} color={theme.mutedForeground} />
            <Text color="muted">Your cart is empty.</Text>
          </View>
        }
        renderItem={({ item }: { item: CartItem }) => {
          const info = productByVariantId.get(item.productVariantId);
          return (
            <Card style={styles.itemCard}>
              <View style={styles.itemRow}>
                <View style={styles.flexShrink}>
                  <Text variant="body">{info?.name ?? "Item"}</Text>
                  {info?.variantName && (
                    <Text variant="caption" color="muted">
                      {info.variantName}
                    </Text>
                  )}
                </View>
                <Text variant="body">{formatRupees(item.priceSnapshotPaise * item.quantity)}</Text>
              </View>
              <View style={styles.qtyRow}>
                <Pressable
                  style={({ pressed }) => [styles.qtyButton, { borderColor: theme.border, backgroundColor: pressed ? theme.muted : "transparent" }]}
                  onPress={() =>
                    item.quantity > 1
                      ? updateQuantity.mutate({ itemId: item.id, quantity: item.quantity - 1 })
                      : removeItem.mutate(item.id)
                  }
                >
                  <Text>–</Text>
                </Pressable>
                <Text style={styles.qtyValue}>{item.quantity}</Text>
                <Pressable
                  style={({ pressed }) => [styles.qtyButton, { borderColor: theme.border, backgroundColor: pressed ? theme.muted : "transparent" }]}
                  onPress={() => updateQuantity.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                >
                  <Text>+</Text>
                </Pressable>
                <Pressable
                  onPress={() => removeItem.mutate(item.id)}
                  style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
                >
                  <Text variant="caption" color="destructive">
                    Remove
                  </Text>
                </Pressable>
              </View>
            </Card>
          );
        }}
        ListFooterComponent={
          cart.items.length > 0 ? (
            <View style={styles.footerSection}>
              <Text variant="subtitle">Fulfillment</Text>
              <View style={styles.chipRow}>
                {(["DELIVERY", "PICKUP"] as const)
                  .filter((type) => (type === "DELIVERY" ? deliveryEnabled : pickupEnabled))
                  .map((type) => {
                    const selected = fulfillmentType === type;
                    return (
                      <Pressable
                        key={type}
                        onPress={() => setFulfillmentType(type)}
                        style={({ pressed }) => [
                          styles.chip,
                          { borderColor: selected ? theme.primary : theme.border, backgroundColor: selected ? theme.primary : pressed ? theme.muted : "transparent" },
                        ]}
                      >
                        <Text style={{ color: selected ? theme.primaryForeground : theme.foreground }}>
                          {type === "DELIVERY" ? "Delivery" : "Pickup"}
                        </Text>
                      </Pressable>
                    );
                  })}
              </View>

              {fulfillmentType === "DELIVERY" && (
                <View style={styles.gap8}>
                  <Text variant="subtitle">Delivery address</Text>
                  {addresses && addresses.length === 0 && (
                    <Text variant="caption" color="muted">
                      Add a delivery address below to place this order.
                    </Text>
                  )}
                  {addresses?.map((addr) => (
                    <Pressable key={addr.id} onPress={() => setAddressId(addr.id)} style={({ pressed }) => pressed && styles.pressed}>
                      <Card style={[styles.addressCard, { borderColor: addressId === addr.id ? theme.primary : theme.border }]}>
                        <Text variant="body">{addr.label}</Text>
                        <Text variant="caption" color="muted">
                          {addr.line1}, {addr.city} {addr.pinCode}
                        </Text>
                      </Card>
                    </Pressable>
                  ))}
                  <Button label="Manage addresses" variant="outline" onPress={() => navigation.navigate("Addresses")} />
                </View>
              )}

              <Text variant="subtitle">Payment method</Text>
              <View style={styles.chipRow}>
                {(["ONLINE", "COD"] as const)
                  .filter((method) => method === "ONLINE" || codEnabled)
                  .map((method) => {
                    const selected = paymentMethod === method;
                    return (
                      <Pressable
                        key={method}
                        onPress={() => setPaymentMethod(method)}
                        style={({ pressed }) => [
                          styles.chip,
                          { borderColor: selected ? theme.primary : theme.border, backgroundColor: selected ? theme.primary : pressed ? theme.muted : "transparent" },
                        ]}
                      >
                        <Text style={{ color: selected ? theme.primaryForeground : theme.foreground }}>
                          {method === "ONLINE" ? "Pay online" : "Cash on delivery"}
                        </Text>
                      </Pressable>
                    );
                  })}
              </View>

              <Input placeholder="Coupon code (optional)" value={couponCode} onChangeText={setCouponCode} autoCapitalize="characters" />

              <View style={styles.summaryRow}>
                <Text variant="body" color="muted">
                  Subtotal
                </Text>
                <Text variant="body">{formatRupees(subtotalPaise)}</Text>
              </View>
              <Text variant="caption" color="muted">
                Delivery fee, taxes, and any discount are calculated at checkout.
              </Text>

              {error && (
                <Text variant="caption" color="destructive">
                  {error}
                </Text>
              )}
            </View>
          ) : null
        }
      />

      {cart.items.length > 0 && (
        <View style={[styles.footer, { borderColor: theme.border }]}>
          <Button
            label={placeOrder.isPending ? "Placing order…" : `Place Order · ${formatRupees(subtotalPaise)}`}
            onPress={() => {
              setError(null);
              placeOrder.mutate();
            }}
            disabled={!canPlaceOrder}
            loading={placeOrder.isPending}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  padding: { padding: 16, gap: 12 },
  flatList: { flex: 1 },
  list: { padding: 16, gap: 10, flexGrow: 1 },
  pressed: { opacity: 0.6 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingBottom: 60 },
  itemCard: { gap: 8 },
  itemRow: { flexDirection: "row", justifyContent: "space-between" },
  flexShrink: { flexShrink: 1 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  qtyButton: { width: 30, height: 30, borderWidth: 1, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  qtyValue: { minWidth: 20, textAlign: "center" },
  removeButton: { marginLeft: "auto" },
  footerSection: { gap: 10, marginTop: 12 },
  gap8: { gap: 8 },
  chipRow: { flexDirection: "row", gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  addressCard: { borderWidth: 1 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
});
