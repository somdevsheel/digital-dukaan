import { useEffect, useRef, useState } from "react";
import { Alert, Animated, Dimensions, FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Text, Input, Card, Skeleton, useTheme } from "@platform/ui-native";
import { apiFetch } from "../lib/api";
import { formatRupees } from "../lib/format";
import { useCity } from "../lib/city-context";
import { getLastCartBusiness } from "../lib/cart-store";
import type { BusinessType, BusinessSearchResult, Product } from "../lib/types";
import type { MainTabScreenProps } from "../navigation/types";

const DRAWER_WIDTH = Math.min(300, Dimensions.get("window").width * 0.78);

const NEARBY_BUSINESSES_TO_SAMPLE = 5;
const PRODUCTS_PER_BUSINESS = 2;

interface NearbyProduct {
  product: Product;
  businessId: string;
  businessName: string;
}

export function HomeScreen({ navigation }: MainTabScreenProps<"HomeTab">) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [categoriesMenuOpen, setCategoriesMenuOpen] = useState(false);
  const drawerX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const { selectedCity, coords, locationStatus, detectedPlaceLabel, isServiceableArea, retryLocation } = useCity();
  // GPS coords only make sense to pass through when they actually belong to the city being
  // browsed — otherwise the backend's radius filter silently excludes every result (e.g. a
  // device in Rudrapur passing its real coords alongside Mumbai's cityId returns zero hits,
  // since every Mumbai business is 1000+ km outside the max search radius).
  const nearCoords = isServiceableArea ? coords : null;

  const { data: businessTypes } = useQuery({
    queryKey: ["business-types"],
    queryFn: () => apiFetch<BusinessType[]>("/business-types"),
  });

  // Same `/businesses` search endpoint the Search screen paginates through — here we just
  // take the first page, scoped to the auto-detected city (and real GPS coords, once
  // available, for genuine distance sorting instead of always-null distances). Skipped
  // entirely outside a serviceable area — `selectedCity` there is just a fallback we no
  // longer browse, not a real substitute for where the user actually is.
  const { data: nearby, isLoading: loadingNearby } = useQuery({
    queryKey: ["nearby-businesses", selectedCity?.id, nearCoords?.latitude, nearCoords?.longitude],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedCity) params.set("cityId", selectedCity.id);
      if (nearCoords) {
        params.set("lat", String(nearCoords.latitude));
        params.set("lng", String(nearCoords.longitude));
      }
      return apiFetch<BusinessSearchResult>(`/businesses?${params.toString()}`);
    },
    enabled: !!selectedCity && isServiceableArea,
  });

  const sampleBusinesses = nearby?.hits.slice(0, NEARBY_BUSINESSES_TO_SAMPLE) ?? [];

  // There's no single "nearby products" endpoint — only per-business catalogs — so the
  // product feed is built client-side: a few products from each of the nearest shops,
  // each one tagged with the shop it came from.
  const productQueries = useQueries({
    queries: sampleBusinesses.map((business) => ({
      queryKey: ["business-products", business.id],
      queryFn: () => apiFetch<Product[]>(`/businesses/${business.id}/products`),
      enabled: sampleBusinesses.length > 0,
    })),
  });

  const loadingNearbyProducts = loadingNearby || productQueries.some((q) => q.isLoading);

  // Recomputed on every render rather than memoized — the list is tiny (at most
  // NEARBY_BUSINESSES_TO_SAMPLE * PRODUCTS_PER_BUSINESS items), and productQueries is a
  // fresh array every render, so memoizing against it would recompute every time anyway.
  const nearbyProducts: NearbyProduct[] = sampleBusinesses.flatMap((business, i) =>
    (productQueries[i]?.data ?? [])
      .slice(0, PRODUCTS_PER_BUSINESS)
      .map((product) => ({ product, businessId: business.id, businessName: business.name })),
  );

  useEffect(() => {
    if (categoriesMenuOpen) {
      drawerX.setValue(-DRAWER_WIDTH);
      Animated.timing(drawerX, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    }
  }, [categoriesMenuOpen, drawerX]);

  const closeCategoriesMenu = () => {
    Animated.timing(drawerX, { toValue: -DRAWER_WIDTH, duration: 200, useNativeDriver: true }).start(() => {
      setCategoriesMenuOpen(false);
    });
  };

  const searchParamsForCity = () => (selectedCity ? { cityId: selectedCity.id } : {});

  const submitSearch = () => {
    navigation.navigate("Search", { ...(query.trim() ? { q: query.trim() } : {}), ...searchParamsForCity() });
  };

  // Carts are scoped per-business (no single global cart on the backend), so the header cart
  // icon jumps to whichever shop's cart was most recently touched — see cart-store.ts.
  const openCart = async () => {
    const lastCartBusiness = await getLastCartBusiness();
    if (!lastCartBusiness) {
      Alert.alert("Your cart is empty", "Browse a shop and add items to see them here.");
      return;
    }
    navigation.navigate("Cart", lastCartBusiness);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => setCategoriesMenuOpen(true)}
            hitSlop={10}
            style={({ pressed }) => [styles.iconButton, pressed && { backgroundColor: theme.muted }]}
          >
            <Ionicons name="menu-outline" size={26} color={theme.foreground} />
          </Pressable>
          <Pressable onPress={openCart} hitSlop={10} style={({ pressed }) => [styles.iconButton, pressed && { backgroundColor: theme.muted }]}>
            <Ionicons name="cart-outline" size={24} color={theme.foreground} />
          </Pressable>
        </View>
        <Text variant="title">Find shops near you</Text>

        {locationStatus === "detecting" && (
          <Text variant="caption" color="muted">
            📍 Detecting your location…
          </Text>
        )}
        {locationStatus === "denied" && (
          <Pressable onPress={retryLocation}>
            <Text variant="caption" color="muted">
              📍 Location permission denied — showing {selectedCity ? `${selectedCity.name}, ${selectedCity.state}` : "default area"}.
              Tap to enable.
            </Text>
          </Pressable>
        )}
        {locationStatus === "unavailable" && selectedCity && (
          <Text variant="caption" color="muted">
            📍 Couldn't detect your location — showing {selectedCity.name}, {selectedCity.state}
          </Text>
        )}
        {locationStatus === "granted" && isServiceableArea && selectedCity && (
          <Text variant="caption" color="muted">
            📍 {selectedCity.name}, {selectedCity.state}
          </Text>
        )}
        {locationStatus === "granted" && !isServiceableArea && (
          <Text variant="caption" color="muted">
            📍 You're in {detectedPlaceLabel ?? "an area"} — not live there yet.
          </Text>
        )}

        <Input
          placeholder="Search shops, products, categories…"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={submitSearch}
          returnKeyType="search"
        />
        <Text variant="subtitle" style={styles.sectionTitle}>
          Recommended near you
        </Text>
        {!isServiceableArea ? (
          <Text color="muted">We're not available in your area yet — check back soon.</Text>
        ) : loadingNearbyProducts ? (
          <View style={styles.nearbyRow}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height={168} width={128} />
            ))}
          </View>
        ) : nearbyProducts.length === 0 ? (
          <Text color="muted">Nothing nearby yet — check back soon.</Text>
        ) : (
          <FlatList
            horizontal
            data={nearbyProducts}
            keyExtractor={(item) => item.product.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.nearbyRow}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => pressed && styles.pressed}
                onPress={() => navigation.navigate("ProductDetail", { businessId: item.businessId, productId: item.product.id })}
              >
                <Card style={styles.productCard}>
                  <View style={[styles.productImage, { backgroundColor: theme.muted }]}>
                    {item.product.images[0] && <Image source={{ uri: item.product.images[0].url }} style={styles.productImage} />}
                  </View>
                  <Text variant="caption" numberOfLines={2} style={styles.productName}>
                    {item.product.name}
                  </Text>
                  <Text variant="caption" style={styles.productPrice}>
                    {formatRupees(item.product.basePricePaise)}
                  </Text>
                  <Text variant="caption" color="muted" numberOfLines={1} style={styles.productShop}>
                    {item.businessName}
                  </Text>
                </Card>
              </Pressable>
            )}
          />
        )}
      </ScrollView>

      <Modal visible={categoriesMenuOpen} transparent animationType="none" onRequestClose={closeCategoriesMenu}>
        <View style={styles.drawerContainer}>
          <Animated.View
            style={[
              styles.drawerSheet,
              {
                width: DRAWER_WIDTH,
                backgroundColor: theme.card,
                paddingTop: insets.top + 16,
                paddingBottom: insets.bottom + 16,
                transform: [{ translateX: drawerX }],
              },
            ]}
          >
            <View style={styles.drawerHeader}>
              <Text variant="subtitle">Categories</Text>
              <Pressable onPress={closeCategoriesMenu} hitSlop={10} style={({ pressed }) => pressed && { opacity: 0.6 }}>
                <Ionicons name="close" size={20} color={theme.mutedForeground} />
              </Pressable>
            </View>
            <FlatList
              data={businessTypes ?? []}
              keyExtractor={(type) => type.id}
              renderItem={({ item: type }) => (
                <Pressable
                  style={({ pressed }) => [styles.modalRow, { borderColor: theme.border }, pressed && { backgroundColor: theme.muted }]}
                  onPress={() => {
                    setCategoriesMenuOpen(false);
                    navigation.navigate("Search", { businessTypeId: type.id, ...searchParamsForCity() });
                  }}
                >
                  <Text style={styles.categoryIcon}>{type.icon ?? "🏪"}</Text>
                  <Text variant="body">{type.name}</Text>
                </Pressable>
              )}
            />
          </Animated.View>
          <Pressable style={styles.drawerBackdrop} onPress={closeCategoriesMenu} />
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  iconButton: { padding: 8, borderRadius: 20 },
  sectionTitle: { marginTop: 8 },
  categoryIcon: { fontSize: 24 },
  nearbyRow: { flexDirection: "row", gap: 10 },
  pressed: { opacity: 0.6 },
  productCard: { width: 128, gap: 2, padding: 8 },
  productImage: { width: "100%", aspectRatio: 1, borderRadius: 8, marginBottom: 4 },
  productName: { fontWeight: "600" },
  productPrice: { marginTop: 2 },
  productShop: { marginTop: 2 },
  drawerContainer: { flex: 1, flexDirection: "row" },
  drawerBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  drawerSheet: { height: "100%", paddingHorizontal: 16 },
  drawerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  modalRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
});
