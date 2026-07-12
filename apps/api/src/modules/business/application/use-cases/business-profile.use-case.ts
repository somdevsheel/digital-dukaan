import { randomUUID } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import {
  BUSINESS_REPOSITORY,
  type BusinessRecord,
  type BusinessRepository,
} from "../../domain/repositories/business.repository";
import {
  BUSINESS_HOUR_REPOSITORY,
  type BusinessHourRecord,
  type BusinessHourRepository,
} from "../../domain/repositories/business-hour.repository";
import {
  BUSINESS_MEDIA_REPOSITORY,
  type BusinessMediaRecord,
  type BusinessMediaRepository,
  type BusinessMediaType,
} from "../../domain/repositories/business-media.repository";
import {
  BUSINESS_DOCUMENT_REPOSITORY,
  type BusinessDocumentRecord,
  type BusinessDocumentRepository,
  type BusinessDocumentType,
} from "../../domain/repositories/business-document.repository";
import {
  BUSINESS_BANK_DETAIL_REPOSITORY,
  type BusinessBankDetailRecord,
  type BusinessBankDetailRepository,
} from "../../domain/repositories/business-bank-detail.repository";
import { STORAGE_PORT, type StoragePort } from "../../../../common/storage/storage.port";
import { FIELD_ENCRYPTION_PORT, type FieldEncryptionPort } from "../../../../common/security/field-encryption.port";
import { BusinessNotFoundException } from "../../domain/errors/business.errors";
import type { UpdateBusinessDto } from "../dto/update-business.dto";
import type { DayHoursDto } from "../dto/business-hours.dto";
import type { UpsertBankDetailDto } from "../dto/bank-detail.dto";

/**
 * Groups every "owner manages their own already-registered business" operation. Each of
 * these (update profile, replace hours, media, documents, bank details) is simple CRUD
 * with no independent branching worth a dedicated use-case class — the same reasoning as
 * AddressUseCase in the Identity module. RegisterBusinessUseCase stays separate because
 * registration has real logic (slug generation, staff bootstrap, token re-mint).
 */
@Injectable()
export class BusinessProfileUseCase {
  constructor(
    @Inject(BUSINESS_REPOSITORY) private readonly businesses: BusinessRepository,
    @Inject(BUSINESS_HOUR_REPOSITORY) private readonly hours: BusinessHourRepository,
    @Inject(BUSINESS_MEDIA_REPOSITORY) private readonly media: BusinessMediaRepository,
    @Inject(BUSINESS_DOCUMENT_REPOSITORY) private readonly documents: BusinessDocumentRepository,
    @Inject(BUSINESS_BANK_DETAIL_REPOSITORY) private readonly bankDetails: BusinessBankDetailRepository,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
    @Inject(FIELD_ENCRYPTION_PORT) private readonly encryption: FieldEncryptionPort,
    private readonly events: EventEmitter2,
  ) {}

  async getById(id: string): Promise<BusinessRecord> {
    const business = await this.businesses.findById(id);
    if (!business) throw new BusinessNotFoundException();
    return business;
  }

  async update(id: string, dto: UpdateBusinessDto): Promise<BusinessRecord> {
    const updated = await this.businesses.update(id, dto);
    this.events.emit("business.updated", { businessId: id });
    return updated;
  }

  async createUploadUrl(businessId: string, folder: string, fileName: string, contentType: string) {
    const key = `businesses/${businessId}/${folder}/${randomUUID()}-${fileName}`;
    return this.storage.getPresignedUploadUrl(key, contentType);
  }

  listHours(businessId: string): Promise<BusinessHourRecord[]> {
    return this.hours.listForBusiness(businessId);
  }

  replaceHours(businessId: string, days: DayHoursDto[]): Promise<BusinessHourRecord[]> {
    return this.hours.replaceWeek(
      businessId,
      days.map((day) => ({
        dayOfWeek: day.dayOfWeek,
        openTime: day.openTime ?? null,
        closeTime: day.closeTime ?? null,
        isClosed: day.isClosed,
      })),
    );
  }

  listMedia(businessId: string): Promise<BusinessMediaRecord[]> {
    return this.media.listForBusiness(businessId);
  }

  async addMedia(businessId: string, type: BusinessMediaType, url: string, sortOrder: number): Promise<BusinessMediaRecord> {
    const record = await this.media.add(businessId, type, url, sortOrder);
    if (type === "LOGO") await this.businesses.update(businessId, { logoUrl: url });
    if (type === "BANNER") await this.businesses.update(businessId, { bannerUrl: url });
    this.events.emit("business.updated", { businessId });
    return record;
  }

  removeMedia(mediaId: string): Promise<void> {
    return this.media.remove(mediaId);
  }

  listDocuments(businessId: string): Promise<BusinessDocumentRecord[]> {
    return this.documents.listForBusiness(businessId);
  }

  recordDocument(businessId: string, type: BusinessDocumentType, fileUrl: string): Promise<BusinessDocumentRecord> {
    return this.documents.create(businessId, type, fileUrl);
  }

  // Account number is never decrypted for display — only ever used server-side (Razorpay
  // linked-account creation, Architecture §10) — BusinessBankDetailRecord's shape already
  // excludes it entirely, so there's nothing to redact here.
  getBankDetail(businessId: string): Promise<BusinessBankDetailRecord | null> {
    return this.bankDetails.getCurrent(businessId);
  }

  upsertBankDetail(businessId: string, dto: UpsertBankDetailDto): Promise<BusinessBankDetailRecord> {
    return this.bankDetails.add(businessId, {
      accountHolderName: dto.accountHolderName,
      accountNumberEncrypted: this.encryption.encrypt(dto.accountNumber),
      ifsc: dto.ifsc,
      upiId: dto.upiId,
    });
  }
}
