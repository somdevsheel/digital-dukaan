import { StyleSheet, View, type ViewProps } from "react-native";
import { useSafeAreaInsets, type Edge } from "react-native-safe-area-context";
import { useTheme } from "../theme";

export interface ScreenProps extends ViewProps {
  /**
   * Safe-area edges to inset for. Defaults to just the top: screens presented under a
   * native-stack header already get top (and bottom-tab-bar) safe-area handling for free,
   * so re-applying it here would double the gap — pass `edges={[]}` on those. Headerless
   * screens (tab roots, auth screens) have nothing else accounting for the notch/status
   * bar, so they need the default.
   */
  edges?: Edge[];
}

export function Screen({ style, edges = ["top"], ...props }: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const inset = {
    paddingTop: edges.includes("top") ? insets.top : 0,
    paddingBottom: edges.includes("bottom") ? insets.bottom : 0,
    paddingLeft: edges.includes("left") ? insets.left : 0,
    paddingRight: edges.includes("right") ? insets.right : 0,
  };

  return <View style={[styles.base, { backgroundColor: theme.background }, inset, style]} {...props} />;
}

const styles = StyleSheet.create({
  base: { flex: 1 },
});
