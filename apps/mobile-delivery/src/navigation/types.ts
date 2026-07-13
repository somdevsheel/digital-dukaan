import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { DeliveryOffer } from "../lib/types";

export type AuthStackParamList = {
  Login: undefined;
  VerifyOtp: { phone: string };
};

export type MainTabParamList = {
  OffersTab: undefined;
  EarningsTab: undefined;
};

export type RootStackParamList = {
  Register: undefined;
  MainTabs: undefined;
  ActiveDelivery: { offer: DeliveryOffer };
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<AuthStackParamList, T>;
