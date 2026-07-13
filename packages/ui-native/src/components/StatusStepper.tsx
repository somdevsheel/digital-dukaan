import { StyleSheet, View } from "react-native";
import { useTheme } from "../theme";
import { Text } from "./Text";

export interface StatusStep {
  label: string;
  done: boolean;
  active: boolean;
}

// The same order/delivery status pattern as @platform/ui's StatusStepper (Wireframes §3 —
// "rendered as a horizontal stepper everywhere it appears"), reimplemented in RN primitives
// rather than shared as-is since Radix/CSS and View/StyleSheet don't compose across targets.
export function StatusStepper({ steps }: { steps: StatusStep[] }) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      {steps.map((step, i) => (
        <View key={step.label} style={[styles.item, i === steps.length - 1 && styles.itemLast]}>
          <View style={styles.dotColumn}>
            <View
              style={[
                styles.dot,
                {
                  borderColor: step.done || step.active ? theme.primary : theme.border,
                  backgroundColor: step.done ? theme.primary : "transparent",
                },
              ]}
            >
              <Text
                variant="caption"
                style={{
                  fontSize: 10,
                  fontWeight: "700",
                  color: step.done ? theme.primaryForeground : step.active ? theme.primary : theme.mutedForeground,
                }}
              >
                {step.done ? "✓" : i + 1}
              </Text>
            </View>
            <Text
              variant="caption"
              style={{ fontSize: 10, marginTop: 4, textAlign: "center", color: step.active ? theme.foreground : theme.mutedForeground }}
              numberOfLines={1}
            >
              {step.label}
            </Text>
          </View>
          {i < steps.length - 1 && (
            <View style={[styles.connector, { backgroundColor: step.done ? theme.primary : theme.border }]} />
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start" },
  item: { flex: 1, flexDirection: "row", alignItems: "center" },
  itemLast: { flex: 0 },
  dotColumn: { alignItems: "center", width: 48 },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  connector: { flex: 1, height: 2, marginHorizontal: 2, marginBottom: 16 },
});
