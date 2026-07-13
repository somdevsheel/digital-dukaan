import * as SecureStore from "expo-secure-store";

const LAST_CART_BUSINESS_KEY = "marketplace.lastCartBusiness";

export interface LastCartBusiness {
  businessId: string;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  codEnabled: boolean;
}

export async function getLastCartBusiness(): Promise<LastCartBusiness | null> {
  const raw = await SecureStore.getItemAsync(LAST_CART_BUSINESS_KEY);
  return raw ? (JSON.parse(raw) as LastCartBusiness) : null;
}

export async function setLastCartBusiness(value: LastCartBusiness): Promise<void> {
  await SecureStore.setItemAsync(LAST_CART_BUSINESS_KEY, JSON.stringify(value));
}
