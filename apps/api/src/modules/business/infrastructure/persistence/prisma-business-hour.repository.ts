import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../common/prisma/prisma.service";
import type { BusinessHourRecord, BusinessHourRepository } from "../../domain/repositories/business-hour.repository";

@Injectable()
export class PrismaBusinessHourRepository implements BusinessHourRepository {
  constructor(private readonly prisma: PrismaService) {}

  listForBusiness(businessId: string): Promise<BusinessHourRecord[]> {
    return this.prisma.businessHour.findMany({
      where: { businessId },
      orderBy: { dayOfWeek: "asc" },
      select: { dayOfWeek: true, openTime: true, closeTime: true, isClosed: true },
    });
  }

  async replaceWeek(businessId: string, hours: BusinessHourRecord[]): Promise<BusinessHourRecord[]> {
    // Whole-week replace runs as a transaction — a merchant's hours should never be
    // readable in a half-updated state between the delete and the re-insert.
    await this.prisma.$transaction([
      this.prisma.businessHour.deleteMany({ where: { businessId } }),
      this.prisma.businessHour.createMany({
        data: hours.map((h) => ({ businessId, ...h })),
      }),
    ]);
    return this.listForBusiness(businessId);
  }
}
