import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { Screen, Text, Button, Input, useTheme } from "@platform/ui-native";
import { apiFetch, ApiError } from "../lib/api";
import type { RootStackScreenProps } from "../navigation/types";

const TIME_WINDOWS = [
  { label: "Morning", value: "09:00-12:00" },
  { label: "Afternoon", value: "12:00-16:00" },
  { label: "Evening", value: "16:00-19:00" },
];

function nextDays(count: number): { iso: string; label: string }[] {
  return Array.from({ length: count }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
    return { iso, label };
  });
}

export function ServiceEnquiryScreen({ route, navigation }: RootStackScreenProps<"ServiceEnquiry">) {
  const theme = useTheme();
  const { businessId, serviceId } = route.params;
  const days = useMemo(() => nextDays(7), []);
  const [date, setDate] = useState(days[0]!.iso);
  const [timeWindow, setTimeWindow] = useState(TIME_WINDOWS[0]!.value);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: () =>
      apiFetch("/service-requests", {
        method: "POST",
        body: {
          businessId,
          ...(serviceId ? { serviceId } : {}),
          preferredDate: date,
          preferredTimeWindow: timeWindow,
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        },
      }),
    onSuccess: () => navigation.goBack(),
    onError: (err) => setError(err instanceof ApiError ? err.message : "Couldn't submit your request. Please try again."),
  });

  return (
    <Screen edges={[]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="title">Request this service</Text>
        <Text variant="caption" color="muted">
          This is a request, not a confirmed booking — the business will confirm or decline.
        </Text>

        <Text variant="subtitle">Preferred date</Text>
        <View style={styles.chipRow}>
          {days.map((d) => (
            <Pressable
              key={d.iso}
              onPress={() => setDate(d.iso)}
              style={[styles.chip, { borderColor: date === d.iso ? theme.primary : theme.border, backgroundColor: date === d.iso ? theme.primary : "transparent" }]}
            >
              <Text style={{ color: date === d.iso ? theme.primaryForeground : theme.foreground }}>{d.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text variant="subtitle">Preferred time</Text>
        <View style={styles.chipRow}>
          {TIME_WINDOWS.map((w) => (
            <Pressable
              key={w.value}
              onPress={() => setTimeWindow(w.value)}
              style={[
                styles.chip,
                { borderColor: timeWindow === w.value ? theme.primary : theme.border, backgroundColor: timeWindow === w.value ? theme.primary : "transparent" },
              ]}
            >
              <Text style={{ color: timeWindow === w.value ? theme.primaryForeground : theme.foreground }}>{w.label}</Text>
            </Pressable>
          ))}
        </View>

        <Input label="Notes (optional)" placeholder="Anything the business should know" value={notes} onChangeText={setNotes} multiline numberOfLines={3} />

        {error && (
          <Text variant="caption" color="destructive">
            {error}
          </Text>
        )}

        <Button label={submit.isPending ? "Submitting…" : "Submit request"} onPress={() => { setError(null); submit.mutate(); }} loading={submit.isPending} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
});
