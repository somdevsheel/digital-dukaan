import { Inject, Injectable } from "@nestjs/common";
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRecord,
  type RefreshTokenRepository,
} from "../../domain/repositories/refresh-token.repository";
import { NotFoundException } from "../../../../common/errors/app.errors";

// GET /auth/sessions and DELETE /auth/sessions/:id (API Design §4.1) are small enough,
// and share enough (both operate on the same repository, neither has meaningful branching
// logic) that splitting them into two separate use-case classes would be ceremony without
// benefit — unlike the auth flows above, which each have real, independently testable logic.
@Injectable()
export class SessionManagementUseCase {
  constructor(@Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokens: RefreshTokenRepository) {}

  async listActiveSessions(userId: string): Promise<RefreshTokenRecord[]> {
    return this.refreshTokens.listActiveForUser(userId);
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    // Scoping the lookup to this user's own active sessions means a session ID belonging
    // to someone else simply isn't found here — no separate ownership check needed.
    const sessions = await this.refreshTokens.listActiveForUser(userId);
    const target = sessions.find((s) => s.id === sessionId);
    if (!target) {
      throw new NotFoundException("Session");
    }
    await this.refreshTokens.revoke(sessionId);
  }
}
