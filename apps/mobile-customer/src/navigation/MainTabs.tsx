import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@platform/ui-native";
import { HomeScreen } from "../screens/HomeScreen";
import { OrdersListScreen } from "../screens/OrdersListScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
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
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersListScreen}
        options={{
          title: "Orders",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "receipt" : "receipt-outline"} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
