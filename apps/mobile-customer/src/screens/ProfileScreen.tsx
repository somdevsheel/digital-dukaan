import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { Screen, Text, Button, Input, Card } from "@platform/ui-native";
import { useAuth } from "../lib/auth-context";
import { apiFetch } from "../lib/api";
import type { MainTabScreenProps } from "../navigation/types";

export function ProfileScreen({ navigation }: MainTabScreenProps<"ProfileTab">) {
  const { user, logout, refreshMe } = useAuth();
  const [name, setName] = useState(user?.fullName ?? "");
  const [logoutLoading, setLogoutLoading] = useState(false);

  const saveName = useMutation({
    mutationFn: () => apiFetch("/me", { method: "PATCH", body: { fullName: name.trim() } }),
    onSuccess: () => refreshMe(),
  });

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="title">Profile</Text>

        {!user?.fullName && (
          <Card>
            <Text variant="body">Add your name so businesses and delivery partners recognize your orders.</Text>
          </Card>
        )}

        <Input label="Name" value={name} onChangeText={setName} placeholder="Your name" />
        <Button
          label={saveName.isPending ? "Saving…" : "Save"}
          variant="outline"
          onPress={() => saveName.mutate()}
          disabled={!name.trim() || name.trim() === user?.fullName || saveName.isPending}
        />

        <View style={styles.infoRow}>
          <Text variant="caption" color="muted">
            Phone
          </Text>
          <Text variant="body">{user?.phone ?? "—"}</Text>
        </View>
        {user?.email && (
          <View style={styles.infoRow}>
            <Text variant="caption" color="muted">
              Email
            </Text>
            <Text variant="body">{user.email}</Text>
          </View>
        )}

        <Button label="Manage addresses" variant="outline" onPress={() => navigation.navigate("Addresses")} />

        <Button
          label={logoutLoading ? "Signing out…" : "Sign out"}
          variant="destructive"
          loading={logoutLoading}
          onPress={() => {
            setLogoutLoading(true);
            void logout();
          }}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14 },
  infoRow: { gap: 2 },
});
