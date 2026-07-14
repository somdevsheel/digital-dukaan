import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Text, Card, Button, useTheme } from "@platform/ui-native";
import { useAuth } from "../lib/auth-context";
import type { BusinessScopedProps } from "../navigation/types";

const LINKS: { screen: "Sales" | "Coupons" | "Staff"; label: string; description: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { screen: "Sales", label: "Sales", description: "Revenue, order counts, trends", icon: "stats-chart-outline" },
  { screen: "Coupons", label: "Coupons", description: "Discount codes for this business", icon: "pricetag-outline" },
  { screen: "Staff", label: "Staff", description: "Invite and manage team access", icon: "people-outline" },
];

export function MoreScreen({ businessId, businessName, navigation }: BusinessScopedProps) {
  const theme = useTheme();
  const { logout } = useAuth();

  return (
    <Screen edges={[]} style={styles.screen}>
      <View style={styles.content}>
        <Text variant="title">{businessName}</Text>
        <View style={styles.linkList}>
          {LINKS.map((link) => (
            <Pressable
              key={link.screen}
              onPress={() => navigation.navigate(link.screen, { businessId })}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Card style={styles.linkCard}>
                <Ionicons name={link.icon} size={22} color={theme.primary} />
                <View style={styles.flexShrink}>
                  <Text variant="subtitle">{link.label}</Text>
                  <Text variant="caption" color="muted">
                    {link.description}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.mutedForeground} />
              </Card>
            </Pressable>
          ))}
        </View>

        <View style={styles.footerActions}>
          <Button label="Switch business" variant="outline" onPress={() => navigation.navigate("BusinessList")} />
          <Button label="Log out" variant="ghost" onPress={() => void logout()} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 16 },
  linkList: { gap: 10 },
  pressed: { opacity: 0.6 },
  linkCard: { flexDirection: "row", alignItems: "center", gap: 12 },
  flexShrink: { flexShrink: 1 },
  footerActions: { gap: 10, marginTop: 8 },
});
