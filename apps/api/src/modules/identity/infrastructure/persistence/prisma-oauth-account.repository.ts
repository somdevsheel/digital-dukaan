import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../common/prisma/prisma.service";
import type {
  OAuthAccountRecord,
  OAuthAccountRepository,
} from "../../domain/repositories/oauth-account.repository";

@Injectable()
export class PrismaOAuthAccountRepository implements OAuthAccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByProviderAccountId(
    provider: "GOOGLE" | "APPLE",
    providerAccountId: string,
  ): Promise<OAuthAccountRecord | null> {
    return this.prisma.oAuthAccount.findUnique({
      where: { provider_providerAccountId: { provider, providerAccountId } },
    });
  }

  link(userId: string, provider: "GOOGLE" | "APPLE", providerAccountId: string): Promise<OAuthAccountRecord> {
    return this.prisma.oAuthAccount.create({ data: { userId, provider, providerAccountId } });
  }
}
