import { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, createTheme } from "@platform/ui-native";
import { AuthProvider } from "./src/lib/auth-context";
import { RootNavigator } from "./src/navigation/RootNavigator";

// A distinct blue from web-public/mobile-customer's coral and web-admin's indigo — delivery
// partners are a fourth, distinct persona (Wireframes §1), so this app earns its own accent
// rather than inheriting the customer brand or clashing with admin's.
const theme = createTheme("#1E88E5");

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
