import { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, createTheme } from "@platform/ui-native";
import { AuthProvider } from "./src/lib/auth-context";
import { CityProvider } from "./src/lib/city-context";
import { RootNavigator } from "./src/navigation/RootNavigator";

// Same coral accent as web-public — both are the customer-facing surface (Architecture §4),
// so the brand should read as one product across web and native, unlike web-merchant/web-admin
// which deliberately diverge per back-office tool.
const theme = createTheme("#E8541F");

export default function App() {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } }));

  return (
    <SafeAreaProvider>
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <CityProvider>
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
            </CityProvider>
          </AuthProvider>
        </QueryClientProvider>
        <StatusBar style="dark" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
