import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { useTheme } from "../theme";

export interface TextProps extends RNTextProps {
  variant?: "title" | "subtitle" | "body" | "caption" | undefined;
  color?: "foreground" | "muted" | "primary" | "destructive" | undefined;
}

const SIZE: Record<NonNullable<TextProps["variant"]>, { fontSize: number; fontWeight: "400" | "600" | "700" }> = {
  title: { fontSize: 22, fontWeight: "700" },
  subtitle: { fontSize: 17, fontWeight: "600" },
  body: { fontSize: 15, fontWeight: "400" },
  caption: { fontSize: 13, fontWeight: "400" },
};

export function Text({ variant = "body", color = "foreground", style, ...props }: TextProps) {
  const theme = useTheme();
  const colorValue =
    color === "muted" ? theme.mutedForeground : color === "primary" ? theme.primary : color === "destructive" ? theme.destructive : theme.foreground;

  return <RNText style={[SIZE[variant], { color: colorValue }, style]} {...props} />;
}
