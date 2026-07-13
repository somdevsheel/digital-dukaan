import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from "react-native";
import { useTheme } from "../theme";

export interface ButtonProps extends Omit<PressableProps, "style"> {
  label: string;
  variant?: "primary" | "outline" | "ghost" | "destructive";
  loading?: boolean;
}

export function Button({ label, variant = "primary", loading = false, disabled, ...props }: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const backgroundColor =
    variant === "primary" ? theme.primary : variant === "destructive" ? theme.destructive : "transparent";
  const borderColor = variant === "outline" ? theme.border : "transparent";
  const textColor =
    variant === "primary" || variant === "destructive" ? theme.primaryForeground : theme.foreground;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor, borderColor, borderWidth: variant === "outline" ? 1 : 0, opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1 },
      ]}
      {...props}
    >
      {loading ? <ActivityIndicator color={textColor} /> : <Text style={[styles.label, { color: textColor }]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
  },
});
