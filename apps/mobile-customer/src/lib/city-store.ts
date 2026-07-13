import * as SecureStore from "expo-secure-store";

const SELECTED_CITY_ID_KEY = "marketplace.selectedCityId";

export async function getSelectedCityId(): Promise<string | null> {
  return SecureStore.getItemAsync(SELECTED_CITY_ID_KEY);
}

export async function setSelectedCityId(cityId: string): Promise<void> {
  await SecureStore.setItemAsync(SELECTED_CITY_ID_KEY, cityId);
}
