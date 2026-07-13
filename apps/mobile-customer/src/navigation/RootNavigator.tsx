import { ActivityIndicator } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Screen, useTheme } from "@platform/ui-native";
import { useAuth } from "../lib/auth-context";
import { AuthNavigator } from "./AuthNavigator";
import { MainTabs } from "./MainTabs";
import { SearchScreen } from "../screens/SearchScreen";
import { BusinessProfileScreen } from "../screens/BusinessProfileScreen";
import { ProductDetailScreen } from "../screens/ProductDetailScreen";
import { CartScreen } from "../screens/CartScreen";
import { OrderTrackingScreen } from "../screens/OrderTrackingScreen";
import { ServiceEnquiryScreen } from "../screens/ServiceEnquiryScreen";
import { AddressesScreen } from "../screens/AddressesScreen";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { status } = useAuth();
  const theme = useTheme();

  if (status === "loading") {
    return (
      <Screen style={{ alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={theme.primary} />
      </Screen>
    );
  }

  if (status === "unauthenticated") {
    return <AuthNavigator />;
  }

  return (
    <Stack.Navigator>
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Search" component={SearchScreen} options={{ title: "Search" }} />
      <Stack.Screen name="BusinessProfile" component={BusinessProfileScreen} options={{ title: "" }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: "" }} />
      <Stack.Screen name="Cart" component={CartScreen} options={{ title: "Cart & Checkout" }} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} options={{ title: "Order" }} />
      <Stack.Screen name="ServiceEnquiry" component={ServiceEnquiryScreen} options={{ title: "Request service" }} />
      <Stack.Screen name="Addresses" component={AddressesScreen} options={{ title: "Addresses" }} />
    </Stack.Navigator>
  );
}
