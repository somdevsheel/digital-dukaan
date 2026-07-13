import { StyleSheet, View, type ViewProps } from "react-native";
import { useTheme } from "../theme";

export function Card({ style, ...props }: ViewProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.base,
        { backgroundColor: theme.card, borderColor: theme.border, borderRadius: theme.radius },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    padding: 12,
  },
});
