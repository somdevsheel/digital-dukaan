import { useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Screen, Text, Badge, Card, Button, Input, useTheme } from "@platform/ui-native";
import { apiFetch, ApiError } from "../lib/api";
import type { StaffMember } from "../lib/types";
import type { RootStackScreenProps } from "../navigation/types";

type Role = "BUSINESS_OWNER" | "BUSINESS_STAFF";

export function StaffScreen({ route }: RootStackScreenProps<"Staff">) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { businessId } = route.params;

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("BUSINESS_STAFF");
  const [error, setError] = useState<string | null>(null);

  const { data: staff } = useQuery({
    queryKey: ["merchant", "staff", businessId],
    queryFn: () => apiFetch<StaffMember[]>(`/merchant/businesses/${businessId}/staff`),
  });

  const invite = useMutation({
    mutationFn: () => apiFetch(`/merchant/businesses/${businessId}/staff/invite`, { method: "POST", body: { email: email.trim(), role } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["merchant", "staff", businessId] });
      setEmail("");
      setRole("BUSINESS_STAFF");
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again."),
  });

  const remove = useMutation({
    mutationFn: (userRoleId: string) => apiFetch(`/merchant/businesses/${businessId}/staff/${userRoleId}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["merchant", "staff", businessId] }),
  });

  return (
    <Screen edges={[]} style={styles.screen}>
      <FlatList
        data={staff ?? []}
        keyExtractor={(m) => m.userRoleId}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.inviteForm}>
            <Input label="Invite by email" placeholder="teammate@example.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
            <Text variant="caption" color="muted">
              The invitee must already have a platform account under this email.
            </Text>
            <View style={styles.chipRow}>
              {(["BUSINESS_STAFF", "BUSINESS_OWNER"] as const).map((r) => {
                const selected = role === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setRole(r)}
                    style={[styles.chip, { borderColor: selected ? theme.primary : theme.border, backgroundColor: selected ? theme.primary : "transparent" }]}
                  >
                    <Text style={{ color: selected ? theme.primaryForeground : theme.foreground }}>{r === "BUSINESS_OWNER" ? "Owner" : "Staff"}</Text>
                  </Pressable>
                );
              })}
            </View>
            {error && (
              <Text variant="caption" color="destructive">
                {error}
              </Text>
            )}
            <Button
              label={invite.isPending ? "Inviting…" : "Invite"}
              onPress={() => {
                setError(null);
                invite.mutate();
              }}
              loading={invite.isPending}
              disabled={!email.trim() || invite.isPending}
            />
            <Text variant="subtitle" style={styles.listTitle}>
              Team
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text color="muted" style={styles.empty}>
            No staff yet.
          </Text>
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.row}>
              <View style={styles.flexShrink}>
                <Text variant="body">{item.userFullName ?? "—"}</Text>
                <Text variant="caption" color="muted">
                  {item.userEmail ?? "—"}
                </Text>
              </View>
              <Badge label={item.roleName === "BUSINESS_OWNER" ? "Owner" : "Staff"} variant={item.roleName === "BUSINESS_OWNER" ? "default" : "secondary"} />
            </View>
            <Button label="Remove" variant="ghost" disabled={remove.isPending} onPress={() => remove.mutate(item.userRoleId)} />
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { padding: 16, gap: 10 },
  inviteForm: { gap: 10, marginBottom: 8 },
  chipRow: { flexDirection: "row", gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  listTitle: { marginTop: 12 },
  empty: { padding: 24, textAlign: "center" },
  card: { gap: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  flexShrink: { flexShrink: 1 },
});
