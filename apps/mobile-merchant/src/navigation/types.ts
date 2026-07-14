import type { NativeStackScreenProps, NativeStackNavigationProp } from "@react-navigation/native-stack";

export type AuthStackParamList = {
  Login: undefined;
};

export type RootStackParamList = {
  BusinessList: undefined;
  RegisterBusiness: undefined;
  BusinessTabs: { businessId: string; businessName: string };
  Coupons: { businessId: string };
  CouponForm: { businessId: string };
  Staff: { businessId: string };
  Sales: { businessId: string };
  ProductForm: { businessId: string; productId?: string };
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<AuthStackParamList, T>;

export type RootNavigation = NativeStackNavigationProp<RootStackParamList>;

/** Props for the screens rendered inside BusinessTabs — the business context comes down
 *  as plain props from the tab navigator's `children` render prop, not route params, since
 *  the tab layer itself carries no per-business param list. */
export interface BusinessScopedProps {
  businessId: string;
  businessName: string;
  navigation: RootNavigation;
}
