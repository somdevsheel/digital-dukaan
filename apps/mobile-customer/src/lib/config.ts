import Constants from "expo-constants";

interface AppExtra {
  apiUrl: string;
  realtimeUrl: string;
  googleMapsApiKey: string;
}

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<AppExtra>;

export const API_URL = extra.apiUrl ?? "http://localhost:4000/api/v1";
export const REALTIME_URL = extra.realtimeUrl ?? "http://localhost:4001";
export const GOOGLE_MAPS_API_KEY = extra.googleMapsApiKey ?? "";
