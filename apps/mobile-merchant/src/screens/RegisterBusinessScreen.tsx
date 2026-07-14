import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Screen, Text, Input, Button, useTheme } from "@platform/ui-native";
import { apiFetch, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import type { Business, BusinessType, City } from "../lib/types";
import type { RootStackScreenProps } from "../navigation/types";

export function RegisterBusinessScreen({ navigation }: RootStackScreenProps<"RegisterBusiness">) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { applyAccessToken } = useAuth();

  const [businessTypeId, setBusinessTypeId] = useState<string | null>(null);
  const [cityId, setCityId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: businessTypes } = useQuery({
    queryKey: ["business-types"],
    queryFn: () => apiFetch<BusinessType[]>("/business-types"),
  });
  const { data: cities } = useQuery({
    queryKey: ["cities"],
    queryFn: () => apiFetch<City[]>("/cities"),
  });

  const register = useMutation({
    mutationFn: () =>
      apiFetch<{ business: Business; accessToken: string }>("/merchant/businesses", {
        method: "POST",
        body: {
          businessTypeId,
          cityId,
          name: name.trim(),
          ...(description.trim() ? { description: description.trim() } : {}),
          addressLine: addressLine.trim(),
          pinCode: pinCode.trim(),
          latitude: Number(latitude),
          longitude: Number(longitude),
        },
      }),
    onSuccess: async (result) => {
      // The API re-mints the caller's access token with this business's BUSINESS_OWNER
      // grant baked in — without swapping to it immediately, every request against the new
      // business (categories, products) 403s until the next login/refresh.
      applyAccessToken(result.accessToken);
      await queryClient.invalidateQueries({ queryKey: ["merchant", "businesses"] });
      navigation.replace("BusinessTabs", { businessId: result.business.id, businessName: result.business.name });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again."),
  });

  const canSubmit =
    !!businessTypeId && !!cityId && name.trim().length >= 2 && addressLine.trim().length > 0 && pinCode.trim().length > 0 && !!latitude && !!longitude;

  return (
    <Screen edges={[]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="subtitle">Business type</Text>
        <View style={styles.chipRow}>
          {businessTypes?.map((type) => {
            const selected = businessTypeId === type.id;
            return (
              <Pressable
                key={type.id}
                onPress={() => setBusinessTypeId(type.id)}
                style={[styles.chip, { borderColor: selected ? theme.primary : theme.border, backgroundColor: selected ? theme.primary : "transparent" }]}
              >
                <Text style={{ color: selected ? theme.primaryForeground : theme.foreground }}>{type.name}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text variant="subtitle" style={styles.sectionTitle}>
          City
        </Text>
        <View style={styles.chipRow}>
          {cities?.map((city) => {
            const selected = cityId === city.id;
            return (
              <Pressable
                key={city.id}
                onPress={() => setCityId(city.id)}
                style={[styles.chip, { borderColor: selected ? theme.primary : theme.border, backgroundColor: selected ? theme.primary : "transparent" }]}
              >
                <Text style={{ color: selected ? theme.primaryForeground : theme.foreground }}>
                  {city.name}, {city.state}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Input label="Business name" value={name} onChangeText={setName} style={styles.field} />
        <Input label="Description (optional)" value={description} onChangeText={setDescription} multiline style={styles.field} />
        <Input label="Address" value={addressLine} onChangeText={setAddressLine} style={styles.field} />
        <Input label="PIN code" value={pinCode} onChangeText={setPinCode} keyboardType="number-pad" maxLength={6} style={styles.field} />
        <View style={styles.row}>
          <Input label="Latitude" value={latitude} onChangeText={setLatitude} keyboardType="numbers-and-punctuation" style={styles.rowField} />
          <Input label="Longitude" value={longitude} onChangeText={setLongitude} keyboardType="numbers-and-punctuation" style={styles.rowField} />
        </View>

        {error && (
          <Text variant="caption" color="destructive">
            {error}
          </Text>
        )}
        <Button
          label={register.isPending ? "Creating…" : "Create business"}
          onPress={() => {
            setError(null);
            register.mutate();
          }}
          loading={register.isPending}
          disabled={!canSubmit || register.isPending}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 4 },
  sectionTitle: { marginTop: 12 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  field: { marginTop: 12 },
  row: { flexDirection: "row", gap: 12, marginTop: 12 },
  rowField: { flex: 1 },
});
