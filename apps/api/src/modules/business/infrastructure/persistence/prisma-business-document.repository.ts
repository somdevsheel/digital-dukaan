import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../common/prisma/prisma.service";
import type {
  BusinessDocumentRecord,
  BusinessDocumentRepository,
  BusinessDocumentType,
  DocumentReviewStatus,
} from "../../domain/repositories/business-document.repository";

@Injectable()
export class PrismaBusinessDocumentRepository implements BusinessDocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  listForBusiness(businessId: string): Promise<BusinessDocumentRecord[]> {
    return this.prisma.businessDocument.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      select: { id: true, businessId: true, type: true, fileUrl: true, status: true, createdAt: true },
    });
  }

  create(businessId: string, type: BusinessDocumentType, fileUrl: string): Promise<BusinessDocumentRecord> {
    return this.prisma.businessDocument.create({
      data: { businessId, type, fileUrl },
      select: { id: true, businessId: true, type: true, fileUrl: true, status: true, createdAt: true },
    });
  }

  setReviewStatus(id: string, status: DocumentReviewStatus, reviewedBy: string): Promise<BusinessDocumentRecord> {
    return this.prisma.businessDocument.update({
      where: { id },
      data: { status, reviewedBy, reviewedAt: new Date() },
      select: { id: true, businessId: true, type: true, fileUrl: true, status: true, createdAt: true },
    });
  }
}
