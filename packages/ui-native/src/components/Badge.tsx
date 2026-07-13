import { StyleSheet, View } from "react-native";
import { useTheme } from "../theme";
import { Text } from "./Text";

export interface BadgeProps {
  label: string;
  variant?: "default" | "secondary" | "success" | "warning" | "destructive" | "outline";
}

export function Badge({ label, variant = "default" }: BadgeProps) {
  const theme = useTheme();
  const palette: Record<NonNullable<BadgeProps["variant"]>, { bg: string; fg: string; border?: string }> = {
    default: { bg: theme.primary, fg: theme.primaryForeground },
    secondary: { bg: theme.secondary, fg: theme.secondaryForeground },
    success: { bg: "#D1FAE5", fg: "#065F46" },
    warning: { bg: "#FEF3C7", fg: "#92400E" },
    destructive: { bg: theme.destructive, fg: theme.destructiveForeground },
    outline: { bg: "transparent", fg: theme.foreground, border: theme.border },
  };
  const colors = palette[variant];

  return (
    <View style={[styles.base, { backgroundColor: colors.bg, borderColor: colors.border ?? "transparent", borderWidth: colors.border ? 1 : 0 }]}>
      <Text variant="caption" style={{ color: colors.fg, fontWeight: "600" }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
});
