import { useEffect, useState } from "react";
import { FlatList, Image, Linking, Pressable, StyleSheet, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Screen, Text, Badge, Card, Button, Skeleton, useTheme } from "@platform/ui-native";
import { apiFetch } from "../lib/api";
import { formatRupees } from "../lib/format";
import { setLastCartBusiness } from "../lib/cart-store";
import type { Business, Cart, Product, Review, ServiceItem } from "../lib/types";
import type { RootStackScreenProps } from "../navigation/types";

type TabKey = "products" | "services" | "reviews" | "about";

export function BusinessProfileScreen({ route, navigation }: RootStackScreenProps<"BusinessProfile">) {
  const theme = useTheme();
  const { slug } = route.params;
  const [tab, setTab] = useState<TabKey>("products");

  const { data: business, isLoading } = useQuery({
    queryKey: ["business", slug],
    queryFn: () => apiFetch<Business>(`/businesses/${slug}`),
  });

  const { data: products } = useQuery({
    queryKey: ["business-products", business?.id],
    queryFn: () => apiFetch<Product[]>(`/businesses/${business!.id}/products`),
    enabled: !!business,
  });

  const { data: services } = useQuery({
    queryKey: ["business-services", business?.id],
    queryFn: () => apiFetch<ServiceItem[]>(`/businesses/${business!.id}/services`),
    enabled: !!business,
  });

  const { data: reviews } = useQuery({
    queryKey: ["business-reviews", business?.id],
    queryFn: () => apiFetch<Review[]>(`/businesses/${business!.id}/reviews`),
    enabled: !!business,
  });

  const { data: cart } = useQuery({
    queryKey: ["cart", business?.id],
    queryFn: () => apiFetch<Cart>(`/carts/${business!.id}`),
    enabled: !!business && !!products,
  });

  const cartTotalPaise = cart?.items.reduce((sum, i) => sum + i.priceSnapshotPaise * i.quantity, 0) ?? 0;
  const cartCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  // Lets the Home screen's cart icon jump straight to this business's cart later, since carts
  // are scoped per-business (there's no single global cart to point it at otherwise).
  useEffect(() => {
    if (business && cartCount > 0) {
      void setLastCartBusiness({
        businessId: business.id,
        deliveryEnabled: business.deliveryEnabled,
        pickupEnabled: business.pickupEnabled,
        codEnabled: business.codEnabled,
      });
    }
  }, [business, cartCount]);

  if (isLoading || !business) {
    return (
      <Screen edges={[]} style={styles.loading}>
        <Skeleton height={160} />
        <View style={{ padding: 16, gap: 8 }}>
          <Skeleton height={24} width="60%" />
          <Skeleton height={16} width="40%" />
        </View>
      </Screen>
    );
  }

  const tabs: { key: TabKey; label: string; visible: boolean }[] = [
    { key: "products", label: "Products", visible: !!products?.length },
    { key: "services", label: "Services", visible: !!services?.length },
    { key: "reviews", label: "Reviews", visible: true },
    { key: "about", label: "About", visible: true },
  ];

  return (
    <Screen edges={[]}>
      <FlatList
        data={tab === "products" ? (products ?? []) : []}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={tab === "products" && products?.length ? styles.gridRow : undefined}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={
          <View>
            {business.bannerUrl ? (
              <Image source={{ uri: business.bannerUrl }} style={styles.banner} />
            ) : (
              <View style={[styles.banner, { backgroundColor: theme.muted }]} />
            )}
            <View style={styles.headerBlock}>
              <View style={styles.titleRow}>
                <Text variant="title" style={styles.flexShrink}>
                  {business.name}
                </Text>
                <Badge label="Verified" />
              </View>
              <View style={styles.metaRow}>
                <Text variant="caption" color={business.isOpen ? undefined : "destructive"}>
                  {business.isOpen ? "Open now" : "Closed"}
                </Text>
                {business.deliveryEnabled && <Badge label="Delivery" variant="outline" />}
                {business.pickupEnabled && <Badge label="Pickup" variant="outline" />}
              </View>
              <Text variant="caption" color="muted">
                {business.addressLine}, {business.pinCode}
              </Text>
              <Button
                label="Directions"
                variant="outline"
                onPress={() => {
                  void Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`);
                }}
              />
            </View>

            <View style={[styles.tabRow, { borderColor: theme.border }]}>
              {tabs
                .filter((t) => t.visible)
                .map((t) => (
                  <Pressable
                    key={t.key}
                    onPress={() => setTab(t.key)}
                    style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}
                  >
                    <Text variant="body" color={tab === t.key ? "primary" : "muted"} style={tab === t.key ? styles.tabActive : undefined}>
                      {t.label}
                    </Text>
                    {tab === t.key && <View style={[styles.tabIndicator, { backgroundColor: theme.primary }]} />}
                  </Pressable>
                ))}
            </View>

            {tab === "services" && (
              <View style={styles.sectionList}>
                {services?.map((service) => (
                  <Pressable
                    key={service.id}
                    onPress={() => navigation.navigate("ServiceEnquiry", { businessId: business.id, serviceId: service.id })}
                    style={({ pressed }) => pressed && styles.pressed}
                  >
                    <Card style={styles.serviceCard}>
                      <View style={styles.serviceRow}>
                        <View style={[styles.serviceImage, { backgroundColor: theme.muted }]}>
                          {service.images[0] && <Image source={{ uri: service.images[0].url }} style={styles.serviceImage} />}
                        </View>
                        <View style={styles.flexShrink}>
                          <View style={styles.cardRow}>
                            <Text variant="subtitle">{service.name}</Text>
                            <Text variant="body">{formatRupees(service.pricePaise)}</Text>
                          </View>
                          {service.description && (
                            <Text variant="caption" color="muted">
                              {service.description}
                            </Text>
                          )}
                        </View>
                      </View>
                    </Card>
                  </Pressable>
                ))}
                {!services?.length && <Text color="muted">No services listed yet.</Text>}
              </View>
            )}

            {tab === "reviews" && (
              <View style={styles.sectionList}>
                {reviews?.map((review) => (
                  <Card key={review.id} style={styles.serviceCard}>
                    <Text variant="body">{"⭐".repeat(review.rating)}</Text>
                    {review.comment && <Text variant="caption">{review.comment}</Text>}
                    {review.reply && (
                      <View style={[styles.replyBox, { backgroundColor: theme.muted }]}>
                        <Text variant="caption">Business reply: {review.reply.message}</Text>
                      </View>
                    )}
                  </Card>
                ))}
                {!reviews?.length && <Text color="muted">No reviews yet.</Text>}
              </View>
            )}

            {tab === "about" && (
              <View style={styles.sectionList}>
                <Text variant="body" color="muted">
                  {business.description ?? "No description provided."}
                </Text>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const lowestPrice = item.variants.length ? Math.min(...item.variants.map((v) => v.pricePaise)) : item.basePricePaise;
          return (
            <Pressable
              style={({ pressed }) => [styles.gridItem, pressed && styles.pressed]}
              onPress={() => navigation.navigate("ProductDetail", { businessId: business.id, productId: item.id })}
            >
              <Card>
                <View style={[styles.productImage, { backgroundColor: theme.muted }]}>
                  {item.images[0] && <Image source={{ uri: item.images[0].url }} style={styles.productImage} />}
                </View>
                <Text variant="caption" numberOfLines={2} style={styles.productName}>
                  {item.name}
                </Text>
                <Text variant="body">{formatRupees(lowestPrice)}</Text>
              </Card>
            </Pressable>
          );
        }}
        ListEmptyComponent={tab === "products" && !products?.length ? <Text color="muted">No products listed yet.</Text> : null}
      />

      {cartCount > 0 && (
        <Pressable
          onPress={() =>
            navigation.navigate("Cart", {
              businessId: business.id,
              deliveryEnabled: business.deliveryEnabled,
              pickupEnabled: business.pickupEnabled,
              codEnabled: business.codEnabled,
            })
          }
          style={({ pressed }) => [styles.cartBarWrap, pressed && { opacity: 0.9 }]}
        >
          <View style={[styles.cartBar, { backgroundColor: theme.primary }]}>
            <Text style={{ color: theme.primaryForeground, fontWeight: "600" }}>
              View Cart · {formatRupees(cartTotalPaise)}
            </Text>
          </View>
        </Pressable>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { padding: 0 },
  scrollContent: { paddingBottom: 24 },
  banner: { width: "100%", height: 140 },
  headerBlock: { padding: 16, gap: 6 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  flexShrink: { flexShrink: 1 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  pressed: { opacity: 0.6 },
  tabRow: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16 },
  tabButton: { paddingVertical: 10, marginRight: 20, position: "relative" },
  tabActive: { fontWeight: "700" },
  tabIndicator: { position: "absolute", left: 0, right: 0, bottom: -1, height: 2, borderRadius: 1 },
  sectionList: { padding: 16, gap: 10 },
  serviceCard: { gap: 4 },
  serviceRow: { flexDirection: "row", gap: 12 },
  serviceImage: { width: 56, height: 56, borderRadius: 8 },
  cardRow: { flexDirection: "row", justifyContent: "space-between" },
  replyBox: { borderRadius: 8, padding: 8, marginTop: 4 },
  gridRow: { paddingHorizontal: 12, gap: 10 },
  gridItem: { flex: 1, marginBottom: 10 },
  productImage: { width: "100%", aspectRatio: 1, borderRadius: 8, marginBottom: 6 },
  productName: { minHeight: 32 },
  cartBarWrap: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  cartBar: { padding: 14, alignItems: "center" },
});
