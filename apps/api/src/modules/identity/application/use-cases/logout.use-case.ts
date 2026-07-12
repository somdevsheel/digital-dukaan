import { Inject, Injectable } from "@nestjs/common";
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from "../../domain/repositories/refresh-token.repository";
import { hashToken } from "../../domain/value-objects/token-hash";

@Injectable()
export class LogoutUseCase {
  constructor(@Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokens: RefreshTokenRepository) {}

  async execute(rawRefreshToken: string): Promise<void> {
    const record = await this.refreshTokens.findByTokenHash(hashToken(rawRefreshToken));
    if (record && !record.revokedAt) {
      await this.refreshTokens.revoke(record.id);
    }
  }
}
