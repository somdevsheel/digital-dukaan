import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { Public } from "../../../common/decorators/public.decorator";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { UnauthenticatedException } from "../../../common/errors/app.errors";
import type { AuthenticatedUser } from "../../../common/types/authenticated-user";
import { RegisterEmailDto } from "../application/dto/register-email.dto";
import { LoginEmailDto } from "../application/dto/login-email.dto";
import { RequestOtpDto } from "../application/dto/request-otp.dto";
import { VerifyOtpDto } from "../application/dto/verify-otp.dto";
import { RefreshTokenDto } from "../application/dto/refresh-token.dto";
import { GoogleOAuthDto } from "../application/dto/google-oauth.dto";
import { RegisterWithEmailUseCase } from "../application/use-cases/register-with-email.use-case";
import { LoginWithEmailUseCase } from "../application/use-cases/login-with-email.use-case";
import { RequestOtpUseCase } from "../application/use-cases/request-otp.use-case";
import { VerifyOtpUseCase } from "../application/use-cases/verify-otp.use-case";
import { RefreshTokensUseCase } from "../application/use-cases/refresh-tokens.use-case";
import { LogoutUseCase } from "../application/use-cases/logout.use-case";
import { GoogleOAuthUseCase } from "../application/use-cases/google-oauth.use-case";
import { SessionManagementUseCase } from "../application/use-cases/session-management.use-case";
import type { AuthResult } from "../application/use-cases/auth-result";

const REFRESH_COOKIE = "refreshToken";
const REFRESH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly registerWithEmail: RegisterWithEmailUseCase,
    private readonly loginWithEmail: LoginWithEmailUseCase,
    private readonly requestOtp: RequestOtpUseCase,
    private readonly verifyOtp: VerifyOtpUseCase,
    private readonly refreshTokens: RefreshTokensUseCase,
    private readonly logout: LogoutUseCase,
    private readonly googleOAuth: GoogleOAuthUseCase,
    private readonly sessions: SessionManagementUseCase,
  ) {}

  @Public()
  @Post("register/email")
  async registerEmail(@Body() dto: RegisterEmailDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.registerWithEmail.execute(dto, requestContext(req));
    return this.respondWithSession(res, result);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 15 * 60_000 } })
  @Post("login/email")
  @HttpCode(HttpStatus.OK)
  async loginEmail(@Body() dto: LoginEmailDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.loginWithEmail.execute(dto, requestContext(req));
    return this.respondWithSession(res, result);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60 * 60_000 } })
  @Post("otp/request")
  @HttpCode(HttpStatus.NO_CONTENT)
  async otpRequest(@Body() dto: RequestOtpDto): Promise<void> {
    await this.requestOtp.execute(dto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 15 * 60_000 } })
  @Post("otp/verify")
  @HttpCode(HttpStatus.OK)
  async otpVerify(@Body() dto: VerifyOtpDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.verifyOtp.execute(dto, requestContext(req));
    return this.respondWithSession(res, result);
  }

  @Public()
  @Post("oauth/google")
  @HttpCode(HttpStatus.OK)
  async oauthGoogle(@Body() dto: GoogleOAuthDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.googleOAuth.execute(dto, requestContext(req));
    return this.respondWithSession(res, result);
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawToken = dto.refreshToken ?? getCookie(req, REFRESH_COOKIE);
    if (!rawToken) {
      throw new UnauthenticatedException("No refresh token present");
    }
    const tokens = await this.refreshTokens.execute(rawToken, requestContext(req));
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, cookieOptions());
    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutSession(@Body() dto: RefreshTokenDto, @Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    const rawToken = dto.refreshToken ?? getCookie(req, REFRESH_COOKIE);
    if (rawToken) {
      await this.logout.execute(rawToken);
    }
    res.clearCookie(REFRESH_COOKIE);
  }

  @Get("sessions")
  async listSessions(@CurrentUser() user: AuthenticatedUser) {
    const sessions = await this.sessions.listActiveSessions(user.userId);
    return sessions.map((s) => ({
      id: s.id,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    }));
  }

  @Delete("sessions/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeSession(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<void> {
    await this.sessions.revokeSession(user.userId, id);
  }

  private respondWithSession(res: Response, result: AuthResult) {
    res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions());
    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        phone: result.user.phone,
        fullName: result.user.fullName,
        isNewUser: result.isNewUser,
      },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }
}

function requestContext(req: Request): { ipAddress?: string | undefined; userAgent?: string | undefined } {
  return { ipAddress: req.ip, userAgent: req.headers["user-agent"] };
}

// @types/cookie-parser declares Request.cookies as `any` — narrowed here once so no call
// site propagates that `any` into its own inference.
function getCookie(req: Request, name: string): string | undefined {
  const cookies = req.cookies as Record<string, string | undefined> | undefined;
  return cookies?.[name];
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    path: "/api/v1/auth",
  };
}
