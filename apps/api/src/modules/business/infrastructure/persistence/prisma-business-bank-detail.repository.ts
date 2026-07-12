import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../common/prisma/prisma.service";
import type {
  BusinessBankDetailRecord,
  BusinessBankDetailRepository,
  UpsertBankDetailInput,
} from "../../domain/repositories/business-bank-detail.repository";

const SELECT = {
  id: true,
  businessId: true,
  accountHolderName: true,
  ifsc: true,
  upiId: true,
  verifiedAt: true,
  createdAt: true,
} as const;

@Injectable()
export class PrismaBusinessBankDetailRepository implements BusinessBankDetailRepository {
  constructor(private readonly prisma: PrismaService) {}

  getCurrent(businessId: string): Promise<BusinessBankDetailRecord | null> {
    return this.prisma.businessBankDetail.findFirst({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      select: SELECT,
    });
  }

  add(businessId: string, input: UpsertBankDetailInput): Promise<BusinessBankDetailRecord> {
    return this.prisma.businessBankDetail.create({
      data: {
        businessId,
        accountHolderName: input.accountHolderName,
        accountNumberEncrypted: input.accountNumberEncrypted,
        ifsc: input.ifsc,
        ...(input.upiId !== undefined ? { upiId: input.upiId } : {}),
      },
      select: SELECT,
    });
  }
}
