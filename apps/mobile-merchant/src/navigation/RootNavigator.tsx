import { ActivityIndicator } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Screen, useTheme } from "@platform/ui-native";
import { useAuth } from "../lib/auth-context";
import { AuthNavigator } from "./AuthNavigator";
import { BusinessTabs } from "./BusinessTabs";
import { BusinessListScreen } from "../screens/BusinessListScreen";
import { RegisterBusinessScreen } from "../screens/RegisterBusinessScreen";
import { CouponsScreen } from "../screens/CouponsScreen";
import { CouponFormScreen } from "../screens/CouponFormScreen";
import { StaffScreen } from "../screens/StaffScreen";
import { SalesScreen } from "../screens/SalesScreen";
import { ProductFormScreen } from "../screens/ProductFormScreen";
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
      <Stack.Screen name="BusinessList" component={BusinessListScreen} options={{ title: "Your businesses" }} />
      <Stack.Screen name="RegisterBusiness" component={RegisterBusinessScreen} options={{ title: "Register business" }} />
      <Stack.Screen name="BusinessTabs" component={BusinessTabs} options={({ route }) => ({ title: route.params.businessName })} />
      <Stack.Screen name="Coupons" component={CouponsScreen} options={{ title: "Coupons" }} />
      <Stack.Screen name="CouponForm" component={CouponFormScreen} options={{ title: "Add coupon" }} />
      <Stack.Screen name="Staff" component={StaffScreen} options={{ title: "Staff" }} />
      <Stack.Screen name="Sales" component={SalesScreen} options={{ title: "Sales" }} />
      <Stack.Screen name="ProductForm" component={ProductFormScreen} options={({ route }) => ({ title: route.params.productId ? "Edit product" : "Add product" })} />
    </Stack.Navigator>
  );
}
