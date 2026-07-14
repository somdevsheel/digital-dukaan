import Constants from "expo-constants";

interface AppExtra {
  apiUrl: string;
}

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<AppExtra>;

export const API_URL = extra.apiUrl ?? "http://localhost:4000/api/v1";
