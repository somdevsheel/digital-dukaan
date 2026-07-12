import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { USER_REPOSITORY } from "./domain/repositories/user.repository";
import { REFRESH_TOKEN_REPOSITORY } from "./domain/repositories/refresh-token.repository";
import { ROLE_REPOSITORY } from "./domain/repositories/role.repository";
import { ADDRESS_REPOSITORY } from "./domain/repositories/address.repository";
import { OAUTH_ACCOUNT_REPOSITORY } from "./domain/repositories/oauth-account.repository";
import { PASSWORD_HASHER } from "./domain/services/password-hasher.port";
import { TOKEN_ISSUER } from "./domain/services/token-issuer.port";
import { OTP_STORE } from "./domain/services/otp-store.port";
import { OTP_SENDER } from "./domain/services/otp-sender.port";
import { GOOGLE_OAUTH_VERIFIER } from "./domain/services/google-oauth-verifier.port";

import { PrismaUserRepository } from "./infrastructure/persistence/prisma-user.repository";
import { PrismaRefreshTokenRepository } from "./infrastructure/persistence/prisma-refresh-token.repository";
import { PrismaRoleRepository } from "./infrastructure/persistence/prisma-role.repository";
import { PrismaAddressRepository } from "./infrastructure/persistence/prisma-address.repository";
import { PrismaOAuthAccountRepository } from "./infrastructure/persistence/prisma-oauth-account.repository";
import { Argon2PasswordHasher } from "./infrastructure/security/argon2-password-hasher";
import { JwtTokenIssuer } from "./infrastructure/security/jwt-token-issuer";
import { RedisOtpStore } from "./infrastructure/external/redis-otp-store";
import { ConsoleOtpSender } from "./infrastructure/external/console-otp-sender";
import { GoogleOAuthVerifierAdapter } from "./infrastructure/external/google-oauth-verifier.adapter";

import { RegisterWithEmailUseCase } from "./application/use-cases/register-with-email.use-case";
import { LoginWithEmailUseCase } from "./application/use-cases/login-with-email.use-case";
import { RequestOtpUseCase } from "./application/use-cases/request-otp.use-case";
import { VerifyOtpUseCase } from "./application/use-cases/verify-otp.use-case";
import { RefreshTokensUseCase } from "./application/use-cases/refresh-tokens.use-case";
import { LogoutUseCase } from "./application/use-cases/logout.use-case";
import { GoogleOAuthUseCase } from "./application/use-cases/google-oauth.use-case";
import { SessionManagementUseCase } from "./application/use-cases/session-management.use-case";
import { ProfileUseCase } from "./application/use-cases/profile.use-case";
import { AddressUseCase } from "./application/use-cases/address.use-case";

import { AuthController } from "./presentation/auth.controller";
import { MeController } from "./presentation/me.controller";
import { JwtStrategy } from "./presentation/strategies/jwt.strategy";

@Module({
  imports: [
    PassportModule,
    // Registered without a static secret/expiry — JwtTokenIssuer supplies both per call
    // (access vs. refresh use different secrets), and JwtStrategy pulls its own from
    // ConfigService directly. This registration only exists to make JwtService injectable.
    JwtModule.register({}),
  ],
  controllers: [AuthController, MeController],
  providers: [
    // Ports -> infrastructure adapters. This block is the single place that wires the
    // interfaces every domain/application file depends on to their concrete
    // implementations — see Architecture §5.
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: REFRESH_TOKEN_REPOSITORY, useClass: PrismaRefreshTokenRepository },
    { provide: ROLE_REPOSITORY, useClass: PrismaRoleRepository },
    { provide: ADDRESS_REPOSITORY, useClass: PrismaAddressRepository },
    { provide: OAUTH_ACCOUNT_REPOSITORY, useClass: PrismaOAuthAccountRepository },
    { provide: PASSWORD_HASHER, useClass: Argon2PasswordHasher },
    { provide: TOKEN_ISSUER, useClass: JwtTokenIssuer },
    { provide: OTP_STORE, useClass: RedisOtpStore },
    { provide: OTP_SENDER, useClass: ConsoleOtpSender },
    { provide: GOOGLE_OAUTH_VERIFIER, useClass: GoogleOAuthVerifierAdapter },

    JwtStrategy,

    RegisterWithEmailUseCase,
    LoginWithEmailUseCase,
    RequestOtpUseCase,
    VerifyOtpUseCase,
    RefreshTokensUseCase,
    LogoutUseCase,
    GoogleOAuthUseCase,
    SessionManagementUseCase,
    ProfileUseCase,
    AddressUseCase,
  ],
  // Exported for other modules whose actions change the *caller's own* grants mid-session
  // and need to re-mint an access token immediately (see TokenIssuerPort.issueAccessToken) —
  // e.g. Business module's RegisterBusinessUseCase. ADDRESS_REPOSITORY is exported for
  // Commerce's checkout, which must confirm a delivery addressId actually belongs to the
  // ordering customer before writing it onto the Order. PASSWORD_HASHER (Argon2) is
  // exported for Delivery module's OTP verification — same low-entropy-code hashing
  // reasoning as auth OTPs (RequestOtpUseCase's doc comment), not password-specific.
  exports: [USER_REPOSITORY, ROLE_REPOSITORY, TOKEN_ISSUER, ADDRESS_REPOSITORY, PASSWORD_HASHER],
})
export class IdentityModule {}
