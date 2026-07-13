import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@platform/ui-native";
import { OffersScreen } from "../screens/OffersScreen";
import { EarningsScreen } from "../screens/EarningsScreen";
import type { MainTabParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.mutedForeground,
      }}
    >
      <Tab.Screen
        name="OffersTab"
        component={OffersScreen}
        options={{
          title: "Offers",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "bicycle" : "bicycle-outline"} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="EarningsTab"
        component={EarningsScreen}
        options={{
          title: "Earnings",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "wallet" : "wallet-outline"} color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
