import { useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Screen, Text, Card, Button, Input, Skeleton } from "@platform/ui-native";
import { apiFetch, ApiError } from "../lib/api";
import type { Address } from "../lib/types";

export function AddressesScreen() {
  const queryClient = useQueryClient();
  const { data: addresses, isLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => apiFetch<Address[]>("/me/addresses"),
  });

  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("Home");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      apiFetch("/me/addresses", {
        method: "POST",
        body: {
          label,
          line1,
          city,
          state,
          pinCode,
          // No device geocoding wired up yet — centroid of the demo launch city is a
          // deliberate placeholder, not a real gap for a delivery-address flow at MVP scope
          // where courier navigation ultimately relies on the text address + phone contact.
          latitude: 19.076,
          longitude: 72.8777,
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["addresses"] });
      setShowForm(false);
      setLine1("");
      setCity("");
      setState("");
      setPinCode("");
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Couldn't save this address."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(`/me/addresses/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["addresses"] }),
  });

  return (
    <Screen edges={[]}>
      <FlatList
        data={isLoading ? [] : (addresses ?? [])}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.gap}>
            {isLoading && <Skeleton height={60} />}
            {!showForm ? (
              <Button label="+ Add address" variant="outline" onPress={() => setShowForm(true)} />
            ) : (
              <Card style={styles.formCard}>
                <Input label="Label" value={label} onChangeText={setLabel} placeholder="Home, Work…" />
                <Input label="Address line" value={line1} onChangeText={setLine1} placeholder="House no, street, area" />
                <Input label="City" value={city} onChangeText={setCity} />
                <Input label="State" value={state} onChangeText={setState} />
                <Input label="PIN code" value={pinCode} onChangeText={setPinCode} keyboardType="number-pad" maxLength={6} />
                {error && (
                  <Text variant="caption" color="destructive">
                    {error}
                  </Text>
                )}
                <Button
                  label={create.isPending ? "Saving…" : "Save address"}
                  onPress={() => {
                    setError(null);
                    create.mutate();
                  }}
                  loading={create.isPending}
                  disabled={!label.trim() || !line1.trim() || !city.trim() || !state.trim() || pinCode.trim().length !== 6}
                />
                <Button label="Cancel" variant="ghost" onPress={() => setShowForm(false)} />
              </Card>
            )}
          </View>
        }
        ListEmptyComponent={!isLoading ? <Text color="muted">No saved addresses yet.</Text> : null}
        renderItem={({ item }) => (
          <Card style={styles.addressCard}>
            <View style={styles.row}>
              <Text variant="subtitle">{item.label}</Text>
              <Button label="Remove" variant="ghost" onPress={() => remove.mutate(item.id)} />
            </View>
            <Text variant="caption" color="muted">
              {item.line1}, {item.city}, {item.state} {item.pinCode}
            </Text>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 10 },
  gap: { gap: 10 },
  formCard: { gap: 10 },
  addressCard: { gap: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
