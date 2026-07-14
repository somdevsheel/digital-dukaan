import { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, createTheme } from "@platform/ui-native";
import { AuthProvider } from "./src/lib/auth-context";
import { RootNavigator } from "./src/navigation/RootNavigator";

// Same teal accent as web-merchant's --primary (hsl(168 76% 28%)) — both are the merchant
// back-office surface (Architecture §4), deliberately distinct from mobile-customer's coral.
const theme = createTheme("#117E68");

export default function App() {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } }));

  return (
    <SafeAreaProvider>
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </AuthProvider>
        </QueryClientProvider>
        <StatusBar style="dark" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
