import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";

export type AuthStackParamList = {
  Login: undefined;
  VerifyOtp: { phone: string };
};

export type MainTabParamList = {
  HomeTab: undefined;
  OrdersTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  Search: { q?: string; cityId?: string; businessTypeId?: string } | undefined;
  BusinessProfile: { slug: string };
  ProductDetail: { businessId: string; productId: string };
  Cart: { businessId: string; deliveryEnabled: boolean; pickupEnabled: boolean; codEnabled: boolean };
  OrderTracking: { orderId: string };
  ServiceEnquiry: { businessId: string; serviceId?: string };
  Addresses: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<AuthStackParamList, T>;
