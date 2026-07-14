import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Screen, Text, Input, Button, useTheme } from "@platform/ui-native";
import { apiFetch, ApiError } from "../lib/api";
import { inDaysIso, todayIso } from "../lib/format";
import type { RootStackScreenProps } from "../navigation/types";

type CouponType = "PERCENT" | "FLAT";

export function CouponFormScreen({ route, navigation }: RootStackScreenProps<"CouponForm">) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { businessId } = route.params;

  const [code, setCode] = useState("");
  const [type, setType] = useState<CouponType>("PERCENT");
  const [value, setValue] = useState("");
  const [minOrderRupees, setMinOrderRupees] = useState("");
  const [startsAt, setStartsAt] = useState(todayIso());
  const [expiresAt, setExpiresAt] = useState(inDaysIso(30));
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      apiFetch(`/merchant/businesses/${businessId}/coupons`, {
        method: "POST",
        body: {
          code: code.trim().toUpperCase(),
          type,
          value: type === "PERCENT" ? Number(value) : Math.round(Number(value) * 100),
          startsAt,
          expiresAt,
          ...(minOrderRupees.trim() ? { minOrderAmountPaise: Math.round(Number(minOrderRupees) * 100) } : {}),
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["merchant", "coupons", businessId] });
      navigation.goBack();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again."),
  });

  const canSubmit = code.trim().length >= 3 && value.trim().length > 0 && !Number.isNaN(Number(value)) && startsAt.trim().length > 0 && expiresAt.trim().length > 0;

  return (
    <Screen edges={[]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Input label="Code" placeholder="WELCOME10" autoCapitalize="characters" value={code} onChangeText={setCode} />

        <Text variant="subtitle" style={styles.sectionTitle}>
          Type
        </Text>
        <View style={styles.chipRow}>
          {(["PERCENT", "FLAT"] as const).map((t) => {
            const selected = type === t;
            return (
              <Pressable
                key={t}
                onPress={() => setType(t)}
                style={[styles.chip, { borderColor: selected ? theme.primary : theme.border, backgroundColor: selected ? theme.primary : "transparent" }]}
              >
                <Text style={{ color: selected ? theme.primaryForeground : theme.foreground }}>{t === "PERCENT" ? "Percent off" : "Flat amount off"}</Text>
              </Pressable>
            );
          })}
        </View>

        <Input
          label={type === "PERCENT" ? "Value, %" : "Value, ₹"}
          value={value}
          onChangeText={setValue}
          keyboardType="decimal-pad"
          style={styles.field}
        />
        <Input
          label="Minimum order amount, ₹ (optional)"
          value={minOrderRupees}
          onChangeText={setMinOrderRupees}
          keyboardType="decimal-pad"
          style={styles.field}
        />
        <View style={styles.row}>
          <Input label="Starts (YYYY-MM-DD)" value={startsAt} onChangeText={setStartsAt} style={styles.rowField} />
          <Input label="Expires (YYYY-MM-DD)" value={expiresAt} onChangeText={setExpiresAt} style={styles.rowField} />
        </View>

        {error && (
          <Text variant="caption" color="destructive">
            {error}
          </Text>
        )}
        <Button
          label={create.isPending ? "Adding…" : "Add coupon"}
          onPress={() => {
            setError(null);
            create.mutate();
          }}
          loading={create.isPending}
          disabled={!canSubmit || create.isPending}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 4 },
  sectionTitle: { marginTop: 12 },
  chipRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  field: { marginTop: 12 },
  row: { flexDirection: "row", gap: 12, marginTop: 12 },
  rowField: { flex: 1 },
});
