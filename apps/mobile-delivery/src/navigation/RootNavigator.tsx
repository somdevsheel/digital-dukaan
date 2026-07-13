import { ActivityIndicator } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Screen, useTheme } from "@platform/ui-native";
import { useAuth } from "../lib/auth-context";
import { apiFetch, ApiError } from "../lib/api";
import { AuthNavigator } from "./AuthNavigator";
import { MainTabs } from "./MainTabs";
import { RegisterScreen } from "../screens/RegisterScreen";
import { ActiveDeliveryScreen } from "../screens/ActiveDeliveryScreen";
import type { RootStackParamList } from "./types";
import type { DeliveryPartner } from "../lib/types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { status } = useAuth();
  const theme = useTheme();

  const { data: partner, isLoading: loadingPartner } = useQuery({
    queryKey: ["delivery-partner-me"],
    queryFn: async () => {
      try {
        return await apiFetch<DeliveryPartner>("/delivery-partners/me");
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    },
    enabled: status === "authenticated",
  });

  if (status === "loading" || (status === "authenticated" && loadingPartner)) {
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
      {!partner ? (
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Register" }} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="ActiveDelivery" component={ActiveDeliveryScreen} options={{ title: "Active delivery" }} />
        </>
      )}
    </Stack.Navigator>
  );
}
