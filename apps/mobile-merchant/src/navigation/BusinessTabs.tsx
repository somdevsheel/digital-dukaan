import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@platform/ui-native";
import { OrdersScreen } from "../screens/OrdersScreen";
import { ProductsScreen } from "../screens/ProductsScreen";
import { MoreScreen } from "../screens/MoreScreen";
import type { RootStackScreenProps } from "./types";

const Tab = createBottomTabNavigator();

// Rendered as a single screen inside RootNavigator's stack (see RootNavigator.tsx) so the
// business context — which business is currently being managed — comes from that screen's
// route params, then flows down to each tab via `children`, not a param list of its own:
// there's no scenario where Orders/Products/More need to navigate to "the same tab for a
// different business" the way stack params usually exist to support.
export function BusinessTabs({ route, navigation }: RootStackScreenProps<"BusinessTabs">) {
  const theme = useTheme();
  const { businessId, businessName } = route.params;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.mutedForeground,
      }}
    >
      <Tab.Screen
        name="OrdersTab"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "receipt" : "receipt-outline"} color={color} size={size} />
          ),
        }}
      >
        {() => <OrdersScreen businessId={businessId} businessName={businessName} navigation={navigation} />}
      </Tab.Screen>
      <Tab.Screen
        name="ProductsTab"
        options={{
          title: "Products",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "cube" : "cube-outline"} color={color} size={size} />
          ),
        }}
      >
        {() => <ProductsScreen businessId={businessId} businessName={businessName} navigation={navigation} />}
      </Tab.Screen>
      <Tab.Screen
        name="MoreTab"
        options={{
          title: "More",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "grid" : "grid-outline"} color={color} size={size} />
          ),
        }}
      >
        {() => <MoreScreen businessId={businessId} businessName={businessName} navigation={navigation} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
