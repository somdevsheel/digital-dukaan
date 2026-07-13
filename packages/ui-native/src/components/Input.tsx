import { forwardRef } from "react";
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { useTheme } from "../theme";
import { Text } from "./Text";

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string | undefined;
}

export const Input = forwardRef<TextInput, InputProps>(({ label, error, style, ...props }, ref) => {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      {label && (
        <Text variant="caption" color="muted" style={styles.label}>
          {label}
        </Text>
      )}
      <TextInput
        ref={ref}
        placeholderTextColor={theme.mutedForeground}
        style={[
          styles.input,
          { borderColor: error ? theme.destructive : theme.border, color: theme.foreground, borderRadius: theme.radius * 0.7 },
          style,
        ]}
        {...props}
      />
      {error && (
        <Text variant="caption" color="destructive" style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
});
Input.displayName = "Input";

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { marginBottom: 2 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  error: { marginTop: 2 },
});
