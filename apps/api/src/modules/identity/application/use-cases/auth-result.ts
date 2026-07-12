import type { UserRecord } from "../../domain/repositories/user.repository";

/** Common return shape for every use case that ends in an authenticated session. */
export interface AuthResult {
  user: UserRecord;
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
}
