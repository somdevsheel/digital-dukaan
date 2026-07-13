import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Screen, Text, Input, Button, useTheme } from "@platform/ui-native";
import { apiFetch, ApiError } from "../lib/api";
import type { City, VehicleType } from "../lib/types";

const VEHICLE_TYPES: { value: VehicleType; label: string }[] = [
  { value: "BIKE", label: "Bike" },
  { value: "BICYCLE", label: "Bicycle" },
  { value: "ON_FOOT", label: "On foot" },
  { value: "VAN", label: "Van" },
];

export function RegisterScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { data: cities } = useQuery({ queryKey: ["cities"], queryFn: () => apiFetch<City[]>("/cities") });
  const [cityId, setCityId] = useState<string | null>(null);
  const [vehicleType, setVehicleType] = useState<VehicleType>("BIKE");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [error, setError] = useState<string | null>(null);

  const register = useMutation({
    mutationFn: () =>
      apiFetch("/delivery-partners/register", {
        method: "POST",
        body: { cityId, vehicleType, ...(vehicleNumber.trim() ? { vehicleNumber: vehicleNumber.trim() } : {}) },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["delivery-partner-me"] }),
    onError: (err) => setError(err instanceof ApiError ? err.message : "Couldn't register. Please try again."),
  });

  return (
    <Screen edges={[]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="title">Become a delivery partner</Text>
        <Text variant="body" color="muted">
          Tell us your city and vehicle to start receiving delivery offers.
        </Text>

        <Text variant="subtitle">City</Text>
        <View style={styles.chipRow}>
          {cities?.map((city) => (
            <Pressable
              key={city.id}
              onPress={() => setCityId(city.id)}
              style={[styles.chip, { borderColor: cityId === city.id ? theme.primary : theme.border, backgroundColor: cityId === city.id ? theme.primary : "transparent" }]}
            >
              <Text style={{ color: cityId === city.id ? theme.primaryForeground : theme.foreground }}>{city.name}</Text>
            </Pressable>
          ))}
        </View>

        <Text variant="subtitle">Vehicle</Text>
        <View style={styles.chipRow}>
          {VEHICLE_TYPES.map((v) => (
            <Pressable
              key={v.value}
              onPress={() => setVehicleType(v.value)}
              style={[
                styles.chip,
                { borderColor: vehicleType === v.value ? theme.primary : theme.border, backgroundColor: vehicleType === v.value ? theme.primary : "transparent" },
              ]}
            >
              <Text style={{ color: vehicleType === v.value ? theme.primaryForeground : theme.foreground }}>{v.label}</Text>
            </Pressable>
          ))}
        </View>

        {vehicleType !== "ON_FOOT" && vehicleType !== "BICYCLE" && (
          <Input label="Vehicle number (optional)" value={vehicleNumber} onChangeText={setVehicleNumber} placeholder="MH01AB1234" autoCapitalize="characters" />
        )}

        {error && (
          <Text variant="caption" color="destructive">
            {error}
          </Text>
        )}

        <Button
          label={register.isPending ? "Registering…" : "Register"}
          onPress={() => {
            setError(null);
            register.mutate();
          }}
          loading={register.isPending}
          disabled={!cityId || register.isPending}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
});
