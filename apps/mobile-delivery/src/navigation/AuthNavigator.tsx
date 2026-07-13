import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { VerifyOtpScreen } from "../screens/auth/VerifyOtpScreen";
import type { AuthStackParamList } from "./types";

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} options={{ headerShown: true, title: "" }} />
    </Stack.Navigator>
  );
}
